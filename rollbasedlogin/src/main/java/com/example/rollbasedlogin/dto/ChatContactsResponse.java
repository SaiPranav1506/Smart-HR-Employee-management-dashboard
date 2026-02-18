package com.example.rollbasedlogin.dto;

import java.util.List;
import java.util.Map;

/**
 * Contacts available for the current authenticated user.
 *
 * - allowedTargets: which role tabs the UI should show
 * - contactsByRole: map from role -> list of contacts
 */
public class ChatContactsResponse {
    private List<String> allowedTargets;
    private Map<String, List<UserPublicDto>> contactsByRole;

    public ChatContactsResponse() {
    }

    public ChatContactsResponse(List<String> allowedTargets, Map<String, List<UserPublicDto>> contactsByRole) {
        this.allowedTargets = allowedTargets;
        this.contactsByRole = contactsByRole;
    }

    public List<String> getAllowedTargets() {
        return allowedTargets;
    }

    public void setAllowedTargets(List<String> allowedTargets) {
        this.allowedTargets = allowedTargets;
    }

    public Map<String, List<UserPublicDto>> getContactsByRole() {
        return contactsByRole;
    }

    public void setContactsByRole(Map<String, List<UserPublicDto>> contactsByRole) {
        this.contactsByRole = contactsByRole;
    }
}
