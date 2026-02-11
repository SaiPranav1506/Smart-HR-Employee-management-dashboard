package com.example.rollbasedlogin.model;



import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    @Column(unique = true)
    private String email;

    private String password;

    private String role;

    // For employees: which HR they belong to (by HR's email)
    private String hrEmail;


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

        public String getHrEmail() {
            return hrEmail;
        }

        public void setHrEmail(String hrEmail) {
            this.hrEmail = hrEmail;
        }

    public String getPassword() {
       return this.password;
    }
    public String getRole() {
       return this.role;
    }

    
}
