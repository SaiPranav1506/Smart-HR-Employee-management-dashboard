package com.example.rollbasedlogin.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.rollbasedlogin.dto.ChatMessageRequest;
import com.example.rollbasedlogin.dto.UserPublicDto;
import com.example.rollbasedlogin.model.ChatMessage;
import com.example.rollbasedlogin.model.User;
import com.example.rollbasedlogin.repository.ChatMessageRepository;
import com.example.rollbasedlogin.repository.UserRepository;
import com.example.rollbasedlogin.util.JwtUtil;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired
    private ChatMessageRepository chatRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private JwtUtil jwtUtil;

    private static String norm(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private String authEmail(String authHeader, String fallbackEmail) {
        String token = parseBearer(authHeader);
        if (token != null && jwtUtil.isTokenValid(token)) {
            return norm(jwtUtil.getEmailFromToken(token));
        }
        return norm(fallbackEmail);
    }

    private String authRole(String authHeader, String fallbackRole) {
        String token = parseBearer(authHeader);
        if (token != null && jwtUtil.isTokenValid(token)) {
            return norm(jwtUtil.getRoleFromToken(token));
        }
        return norm(fallbackRole);
    }

    private String parseBearer(String authHeader) {
        if (authHeader == null) return null;
        String h = authHeader.trim();
        if (h.toLowerCase(Locale.ROOT).startsWith("bearer ")) {
            return h.substring("bearer ".length()).trim();
        }
        return null;
    }

    @PostMapping("/messages")
    public ResponseEntity<?> sendMessage(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody ChatMessageRequest req) {

        String senderEmail = authEmail(authHeader, req.getSenderEmail());
        String senderRole = authRole(authHeader, req.getSenderRole());

        String receiverEmail = norm(req.getReceiverEmail());
        String receiverRole = norm(req.getReceiverRole());

        String content = norm(req.getContent());
        if (senderEmail == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("senderEmail missing");
        }
        if (content == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("content is required");
        }
        if (receiverEmail == null && receiverRole == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("receiverEmail or receiverRole is required");
        }

        ChatMessage m = new ChatMessage();
        m.setSenderEmail(senderEmail);
        m.setSenderRole(senderRole);
        m.setReceiverEmail(receiverEmail);
        m.setReceiverRole(receiverRole);
        m.setSubject(norm(req.getSubject()));
        m.setContent(content);
        m.setMessageType(norm(req.getMessageType()));
        m.setCreatedAt(LocalDateTime.now().toString());
        m.setReadFlag(false);

        chatRepo.save(m);
        return ResponseEntity.status(HttpStatus.CREATED).body(m);
    }

    @GetMapping("/inbox")
    public ResponseEntity<?> inbox(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String role) {

        String effectiveEmail = authEmail(authHeader, email);
        String effectiveRole = authRole(authHeader, role);
        if (effectiveEmail == null && effectiveRole == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("email or role is required");
        }

        // if email missing but we have role, still allow role inbox
        String e = effectiveEmail == null ? "" : effectiveEmail;
        String r = effectiveRole == null ? "" : effectiveRole;
        List<ChatMessage> list = chatRepo.inbox(e, r);
        // keep payload small
        if (list.size() > 50) list = list.subList(0, 50);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/conversation")
    public ResponseEntity<?> conversation(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String email,
            @RequestParam String withEmail) {

        String me = authEmail(authHeader, email);
        String other = norm(withEmail);
        if (me == null) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("email missing");
        if (other == null) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("withEmail missing");

        List<ChatMessage> list = chatRepo.conversation(me, other);
        if (list.size() > 200) {
            list = list.subList(list.size() - 200, list.size());
        }
        return ResponseEntity.ok(list);
    }

    @PutMapping("/messages/{id}/read")
    public ResponseEntity<?> markRead(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestParam(required = false) String email) {

        String me = authEmail(authHeader, email);
        Optional<ChatMessage> opt = chatRepo.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body("Message not found");

        ChatMessage m = opt.get();
        if (me != null && m.getReceiverEmail() != null && !m.getReceiverEmail().equalsIgnoreCase(me)) {
            // if it wasn't addressed directly, allow role inbox messages to be marked read by anyone with that role
            String role = authRole(authHeader, null);
            if (role == null || m.getReceiverRole() == null || !m.getReceiverRole().equalsIgnoreCase(role)) {
                return ResponseEntity.status(403).body("Not allowed");
            }
        }

        m.setReadFlag(true);
        chatRepo.save(m);
        return ResponseEntity.ok("Marked as read");
    }

    @GetMapping("/contacts")
    public ResponseEntity<?> contacts(@RequestParam String role) {
        String r = norm(role);
        if (r == null) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("role is required");

        List<User> users = userRepo.findByRoleIgnoreCaseOrderByUsernameAsc(r);
        List<UserPublicDto> out = users.stream()
                .map(u -> new UserPublicDto(u.getEmail(), u.getUsername(), u.getRole()))
                .toList();
        return ResponseEntity.ok(out);
    }
}
