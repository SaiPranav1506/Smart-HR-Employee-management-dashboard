package com.example.rollbasedlogin;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableCaching
public class RollbasedloginApplication {

	public static void main(String[] args) {
		SpringApplication.run(RollbasedloginApplication.class, args);
	}

}
