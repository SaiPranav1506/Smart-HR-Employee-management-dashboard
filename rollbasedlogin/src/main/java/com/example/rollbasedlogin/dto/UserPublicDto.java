package com.example.rollbasedlogin.dto;

public class UserPublicDto {
    private String email;
    private String username;
    private String role;

    public UserPublicDto() {}

    public UserPublicDto(String email, String username, String role) {
        this.email = email;
        this.username = username;
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
