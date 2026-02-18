package com.example.rollbasedlogin.controller;



import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.rollbasedlogin.dto.LoginRequest;
import com.example.rollbasedlogin.dto.LoginResponse;
import com.example.rollbasedlogin.dto.RegisterRequest;
import com.example.rollbasedlogin.dto.TwoFactorStartResponse;
import com.example.rollbasedlogin.dto.TwoFactorVerifyRequest;
import com.example.rollbasedlogin.model.Driver;
import com.example.rollbasedlogin.model.User;
import com.example.rollbasedlogin.repository.DriverRepository;
import com.example.rollbasedlogin.repository.UserRepository;
import com.example.rollbasedlogin.service.TwoFactorService;
import com.example.rollbasedlogin.util.JwtUtil;

@RestController
@RequestMapping("/api/auth")  // 🔥 This is important!
public class AuthController {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private DriverRepository driverRepo;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private TwoFactorService twoFactorService;

    @Value("${app.2fa.enabled:true}")
    private boolean twoFactorEnabled;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/register")
    @CacheEvict(cacheNames = {"contactsByRole", "employeesByHr", "driversMerged"}, allEntries = true)
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email is required");
        }

        if (userRepo.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
        }

        String role = request.getRole() == null ? "" : request.getRole().trim();
        if (role.equalsIgnoreCase("employee")) {
            String hrEmail = request.getHrEmail();
            if (hrEmail == null || hrEmail.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("HR Email is required for employee registration");
            }

            Optional<User> hrUser = userRepo.findByEmail(hrEmail.trim());
            if (hrUser.isEmpty() || hrUser.get().getRole() == null || !hrUser.get().getRole().equalsIgnoreCase("hr")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid HR Email. Please enter a registered HR email.");
            }
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        if (role.equalsIgnoreCase("employee")) {
            user.setHrEmail(request.getHrEmail().trim());
        }

        userRepo.save(user);

        if (request.getRole() != null && request.getRole().equalsIgnoreCase("driver")) {
            Driver driver = new Driver();
            driver.setName(request.getUsername());
            driver.setEmail(request.getEmail());
            driver.setCabType(request.getCabType() == null ? "Cab" : request.getCabType());
            driver.setAvailable(request.getAvailable() == null ? true : request.getAvailable());
            driverRepo.save(driver);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepo.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email");
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid password");
        }

        if (!twoFactorEnabled) {
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
            return ResponseEntity.ok(new LoginResponse(token, user.getRole()));
        }

        try {
            TwoFactorService.StartResult start = twoFactorService.start(user.getEmail(), user.getRole());
            TwoFactorStartResponse response = new TwoFactorStartResponse();
            response.setTwoFactorRequired(true);
            response.setVerificationId(start.getVerificationId());
            response.setExpiresAtEpochMs(start.getExpiresAtEpochMs());
            response.setMessage("Verification code sent to your email.");
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(ex.getMessage());
        }
    }

    @PostMapping("/verify-2fa")
    public ResponseEntity<?> verifyTwoFactor(@RequestBody TwoFactorVerifyRequest request) {
        if (!twoFactorEnabled) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("2FA is disabled");
        }

        try {
            TwoFactorService.VerifiedPrincipal principal = twoFactorService.verify(
                    request.getVerificationId(),
                    request.getCode()
            );

            String token = jwtUtil.generateToken(principal.getEmail(), principal.getRole());
            return ResponseEntity.ok(new LoginResponse(token, principal.getRole()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ex.getMessage());
        }
    }
}
