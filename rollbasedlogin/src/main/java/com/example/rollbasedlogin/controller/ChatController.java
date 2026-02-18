package com.example.rollbasedlogin.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
import com.example.rollbasedlogin.dto.ChatContactsResponse;
import com.example.rollbasedlogin.dto.UserPublicDto;
import com.example.rollbasedlogin.model.ChatMessage;
import com.example.rollbasedlogin.model.Driver;
import com.example.rollbasedlogin.model.User;
import com.example.rollbasedlogin.repository.ChatMessageRepository;
import com.example.rollbasedlogin.repository.DriverRepository;
import com.example.rollbasedlogin.repository.UserRepository;
import com.example.rollbasedlogin.service.CachedDirectoryService;
import com.example.rollbasedlogin.util.JwtUtil;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired
    private ChatMessageRepository chatRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired(required = false)
    private DriverRepository driverRepo;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CachedDirectoryService directoryService;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    private void publishToLiveInbox(ChatMessage m) {
        if (messagingTemplate == null || m == null) return;

        // Direct inbox (email)
        if (m.getReceiverEmail() != null && !m.getReceiverEmail().isBlank()) {
            String key = m.getReceiverEmail().trim().toLowerCase(Locale.ROOT);
            messagingTemplate.convertAndSend("/topic/inbox." + key, m);
        }

        // Role-based inbox
        if (m.getReceiverRole() != null && !m.getReceiverRole().isBlank()) {
            String key = m.getReceiverRole().trim().toLowerCase(Locale.ROOT);
            messagingTemplate.convertAndSend("/topic/inbox.role." + key, m);
        }
    }

    private static String norm(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String lower(String s) {
        if (s == null) return null;
        return s.trim().toLowerCase(Locale.ROOT);
    }

    private static UserPublicDto toPublic(User u) {
        if (u == null) return null;
        return new UserPublicDto(u.getEmail(), u.getUsername(), u.getRole());
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
        publishToLiveInbox(m);
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

        // Notify receivers that inbox changed (simple approach: publish the updated message)
        publishToLiveInbox(m);
        return ResponseEntity.ok("Marked as read");
    }

    @GetMapping("/contacts")
    public ResponseEntity<?> contacts(@RequestParam String role) {
        String r = norm(role);
        if (r == null) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("role is required");

        // Cached: high reuse across chat UI refreshes
        return ResponseEntity.ok(directoryService.contactsByRole(lower(r)));
    }

    @GetMapping("/contacts-for-me")
    public ResponseEntity<?> contactsForMe(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String meEmail = authEmail(authHeader, null);
        String meRole = lower(authRole(authHeader, null));
        if (meEmail == null || meRole == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid token");
        }

        Optional<User> meOpt = userRepo.findByEmail(meEmail);
        String myHrEmail = meOpt.map(User::getHrEmail).orElse(null);

        java.util.Map<String, java.util.List<UserPublicDto>> contactsByRole = new java.util.LinkedHashMap<>();
        java.util.List<String> allowedTargets = new java.util.ArrayList<>();

        if ("hr".equals(meRole)) {
            // HR: employees under them, drivers, fellow HRs
            allowedTargets.add("employee");
            allowedTargets.add("driver");
            allowedTargets.add("hr");

            List<UserPublicDto> employees = directoryService.employeesForHr(lower(meEmail));

            List<UserPublicDto> drivers = directoryService.driversMerged();

            List<UserPublicDto> hrs = directoryService.contactsByRole("hr")
                    .stream()
                    .filter(u -> u.getEmail() != null && !u.getEmail().equalsIgnoreCase(meEmail))
                    .toList();

            contactsByRole.put("employee", employees);
            contactsByRole.put("driver", drivers);
            contactsByRole.put("hr", hrs);
        } else if ("employee".equals(meRole)) {
            // Employee: their HR only, and fellow employees under same HR
            allowedTargets.add("hr");
            allowedTargets.add("employee");

            java.util.List<UserPublicDto> hrList = new java.util.ArrayList<>();
            if (myHrEmail != null && !myHrEmail.isBlank()) {
                userRepo.findByEmail(myHrEmail.trim()).map(ChatController::toPublic).ifPresent(hrList::add);
            }

            List<UserPublicDto> peers = (myHrEmail == null || myHrEmail.isBlank())
                    ? java.util.List.of()
                    : directoryService.employeesForHr(lower(myHrEmail))
                        .stream()
                        .filter(u -> u.getEmail() != null && !u.getEmail().equalsIgnoreCase(meEmail))
                        .toList();

            contactsByRole.put("hr", hrList);
            contactsByRole.put("employee", peers);
        } else if ("driver".equals(meRole)) {
            // Driver: all HRs, and fellow drivers
            allowedTargets.add("hr");
            allowedTargets.add("driver");

            List<UserPublicDto> hrs = directoryService.contactsByRole("hr")
                    .stream()
                    .filter(u -> u.getEmail() != null)
                    .toList();

            List<UserPublicDto> drivers = directoryService.driversMerged()
                    .stream()
                    .filter(u -> u.getEmail() != null && !u.getEmail().equalsIgnoreCase(meEmail))
                    .toList();

            contactsByRole.put("hr", hrs);
            contactsByRole.put("driver", drivers);
        } else if ("admin".equals(meRole)) {
            // Admin: keep broad access
            allowedTargets.add("hr");
            allowedTargets.add("employee");
            allowedTargets.add("driver");

            contactsByRole.put("hr", directoryService.contactsByRole("hr"));
            contactsByRole.put("employee", directoryService.contactsByRole("employee"));
            contactsByRole.put("driver", directoryService.driversMerged());
        } else {
            allowedTargets.add("hr");
            allowedTargets.add("employee");
            allowedTargets.add("driver");
            contactsByRole.put("hr", java.util.List.of());
            contactsByRole.put("employee", java.util.List.of());
            contactsByRole.put("driver", java.util.List.of());
        }

        ChatContactsResponse resp = new ChatContactsResponse(allowedTargets, contactsByRole);
        return ResponseEntity.ok(resp);
    }

    // ===================== TRIP-SPECIFIC MESSAGING =====================

    /**
     * GET trip messages - retrieve all messages for a specific trip
     */
    @GetMapping("/trip/{tripId}/messages")
    public ResponseEntity<?> getTripMessages(
            @PathVariable Long tripId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String meEmail = authEmail(authHeader, null);
            if (meEmail == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
            }

            List<ChatMessage> messages = chatRepo.findByTripId(tripId);
            // Filter to only return messages where the user is sender or receiver
            List<ChatMessage> filtered = messages.stream()
                    .filter(m -> 
                        (m.getSenderEmail() != null && m.getSenderEmail().equalsIgnoreCase(meEmail)) ||
                        (m.getReceiverEmail() != null && m.getReceiverEmail().equalsIgnoreCase(meEmail))
                    )
                    .toList();

            return ResponseEntity.ok(filtered);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving trip messages: " + e.getMessage());
        }
    }

    /**
     * POST trip message - send a message for a specific trip
     */
    @PostMapping("/trip/{tripId}/send")
    public ResponseEntity<?> sendTripMessage(
            @PathVariable Long tripId,
            @RequestBody ChatMessageRequest req,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String senderEmail = authEmail(authHeader, null);
            String senderRole = authRole(authHeader, req.getSenderRole());

            if (senderEmail == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            ChatMessage msg = new ChatMessage();
            msg.setSenderEmail(senderEmail);
            msg.setSenderRole(norm(senderRole));
            msg.setReceiverEmail(norm(req.getReceiverEmail()));
            msg.setReceiverRole(norm(req.getReceiverRole()));
            msg.setSubject(norm(req.getSubject()));
            msg.setContent(norm(req.getContent()));
            msg.setMessageType("TRIP_DIRECTION"); // New message type for trip-specific messages
            msg.setTripId(tripId);
            msg.setCreatedAt(LocalDateTime.now().toString());
            msg.setReadFlag(false);

            ChatMessage saved = chatRepo.save(msg);

            // Publish to WebSocket topics
            publishToLiveInbox(saved);
            
            // Also publish to trip-specific topic
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend("/topic/trip." + tripId, saved);
            }

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error sending trip message: " + e.getMessage());
        }
    }

    /**
     * GET driver's assigned trips with unread message count
     */
    @GetMapping("/driver/trips-with-messages")
    public ResponseEntity<?> getDriverTripsWithMessages(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String driverEmail = authEmail(authHeader, null);
            if (driverEmail == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            // This endpoint requires using DriverRepository or BookingRepository
            // You'll need to inject BookingRepository in ChatController
            List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
            // Implementation depends on your existing booking retrieval logic
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving driver trips: " + e.getMessage());
        }
    }

    /**
     * Mark trip message as read
     */
    @PutMapping("/trip/{tripId}/message/{messageId}/read")
    public ResponseEntity<?> markTripMessageAsRead(
            @PathVariable Long tripId,
            @PathVariable Long messageId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String meEmail = authEmail(authHeader, null);
            if (meEmail == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            java.util.Optional<ChatMessage> optMsg = chatRepo.findById(messageId);
            if (optMsg.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Message not found");
            }

            ChatMessage msg = optMsg.get();
            if (msg.getTripId() == null || !msg.getTripId().equals(tripId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Message does not belong to this trip");
            }

            msg.setReadFlag(true);
            ChatMessage updated = chatRepo.save(msg);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error marking message as read: " + e.getMessage());
        }
    }
}

