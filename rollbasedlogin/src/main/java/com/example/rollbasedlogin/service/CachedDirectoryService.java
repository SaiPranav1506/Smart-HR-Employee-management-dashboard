package com.example.rollbasedlogin.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.example.rollbasedlogin.dto.UserPublicDto;
import com.example.rollbasedlogin.model.Driver;
import com.example.rollbasedlogin.model.User;
import com.example.rollbasedlogin.repository.DriverRepository;
import com.example.rollbasedlogin.repository.UserRepository;

@Service
public class CachedDirectoryService {

    private static final Logger log = LoggerFactory.getLogger(CachedDirectoryService.class);

    private final UserRepository userRepo;

    @Autowired(required = false)
    private DriverRepository driverRepo;

    public CachedDirectoryService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    private static String normKey(String s) {
        if (s == null) return null;
        String t = s.trim();
        if (t.isEmpty()) return null;
        return t.toLowerCase(Locale.ROOT);
    }

    private static UserPublicDto toPublic(User u) {
        if (u == null) return null;
        return new UserPublicDto(u.getEmail(), u.getUsername(), u.getRole());
    }

    @Cacheable(cacheNames = "contactsByRole", key = "#roleKey")
    public List<UserPublicDto> contactsByRole(String roleKey) {
        log.debug("Cache MISS -> computing contactsByRole(roleKey={})", roleKey);
        String r = normKey(roleKey);
        if (r == null) return List.of();

        return userRepo.findByRoleIgnoreCaseOrderByUsernameAsc(r)
                .stream()
                .filter(u -> u.getEmail() != null)
                .map(CachedDirectoryService::toPublic)
                .toList();
    }

    @Cacheable(cacheNames = "employeesByHr", key = "#hrEmailKey")
    public List<UserPublicDto> employeesForHr(String hrEmailKey) {
        log.debug("Cache MISS -> computing employeesForHr(hrEmailKey={})", hrEmailKey);
        String hr = normKey(hrEmailKey);
        if (hr == null) return List.of();

        return userRepo.findByRoleIgnoreCaseAndHrEmailIgnoreCaseOrderByUsernameAsc("employee", hr)
                .stream()
                .filter(u -> u.getEmail() != null)
                .map(CachedDirectoryService::toPublic)
                .toList();
    }

    @Cacheable(cacheNames = "driversMerged")
    public List<UserPublicDto> driversMerged() {
        log.debug("Cache MISS -> computing driversMerged()") ;
        LinkedHashMap<String, UserPublicDto> driversMap = new LinkedHashMap<>();

        for (User u : userRepo.findByRoleIgnoreCaseOrderByUsernameAsc("driver")) {
            if (u.getEmail() == null) continue;
            String key = normKey(u.getEmail());
            if (key == null) continue;
            driversMap.putIfAbsent(key, toPublic(u));
        }

        if (driverRepo != null) {
            for (Driver d : driverRepo.findAll()) {
                if (d.getEmail() == null || d.getEmail().isBlank()) continue;
                String key = normKey(d.getEmail());
                if (key == null) continue;
                driversMap.putIfAbsent(key, new UserPublicDto(d.getEmail(), d.getName(), "driver"));
            }
        }

        return new ArrayList<>(driversMap.values());
    }
}
