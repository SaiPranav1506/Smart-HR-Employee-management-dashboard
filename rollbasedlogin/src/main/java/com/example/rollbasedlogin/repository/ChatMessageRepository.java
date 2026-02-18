package com.example.rollbasedlogin.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.rollbasedlogin.model.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("select m from ChatMessage m " +
            "where (lower(m.receiverEmail) = lower(:email)) " +
            "   or (m.receiverEmail is null and m.receiverRole is not null and lower(m.receiverRole) = lower(:role)) " +
            "order by m.id desc")
    List<ChatMessage> inbox(@Param("email") String email, @Param("role") String role);

    @Query("select m from ChatMessage m " +
            "where (lower(m.senderEmail) = lower(:a) and lower(m.receiverEmail) = lower(:b)) " +
            "   or (lower(m.senderEmail) = lower(:b) and lower(m.receiverEmail) = lower(:a)) " +
            "order by m.id asc")
    List<ChatMessage> conversation(@Param("a") String a, @Param("b") String b);

    // Find all messages for a specific trip/booking
    @Query("select m from ChatMessage m where m.tripId = :tripId order by m.id asc")
    List<ChatMessage> findByTripId(@Param("tripId") Long tripId);

    // Find messages between a driver and employee for a specific trip
    @Query("select m from ChatMessage m " +
            "where m.tripId = :tripId " +
            "  and ((lower(m.senderEmail) = lower(:sender) and lower(m.receiverEmail) = lower(:receiver)) " +
            "    or (lower(m.senderEmail) = lower(:receiver) and lower(m.receiverEmail) = lower(:sender))) " +
            "order by m.id asc")
    List<ChatMessage> findTripConversation(@Param("tripId") Long tripId, @Param("sender") String sender, @Param("receiver") String receiver);
}

