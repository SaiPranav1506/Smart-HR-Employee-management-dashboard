package com.example.rollbasedlogin.model;



import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    @Column(unique = true)
    private String email;

    private String password;

    private String role;


   public String getEmail()
    {
        return this.email;
    }

   public Long getId() {
       return this.id;
   }

   public String getUsername() {
       return this.username;
   }
    
   public void setPassword(String p)
    {
        this.password=p;
    }
    public void setUsername(String u)
    {
        this.username=u;
    }

    public void setEmail(String e)
    {
        this.email=e;
    }
    public void setRole(String r)
    {
        this.role=r;
    }

    public String getPassword() {
       return this.password;
    }
    public String getRole() {
       return this.role;
    }

    
}
