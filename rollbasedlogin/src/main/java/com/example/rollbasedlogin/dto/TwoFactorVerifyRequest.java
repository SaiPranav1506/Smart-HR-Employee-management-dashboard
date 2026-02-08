package com.example.rollbasedlogin.dto;

public class TwoFactorVerifyRequest {
    private String verificationId;
    private String code;

    public String getVerificationId() {
        return verificationId;
    }

    public void setVerificationId(String verificationId) {
        this.verificationId = verificationId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
