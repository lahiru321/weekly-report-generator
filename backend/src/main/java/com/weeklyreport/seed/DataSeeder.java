package com.weeklyreport.seed;

import com.weeklyreport.project.Project;
import com.weeklyreport.project.ProjectRepository;
import com.weeklyreport.user.Role;
import com.weeklyreport.user.User;
import com.weeklyreport.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Fills an empty database with demo users, projects and six weeks of reports.
 * All demo accounts use the password "Password123!".
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DataSeeder implements CommandLineRunner {

    static final String DEMO_PASSWORD = "Password123!";

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final PasswordEncoder passwordEncoder;
    private final ReportSeeder reportSeeder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        String passwordHash = passwordEncoder.encode(DEMO_PASSWORD);

        createUser("Alex Morgan", "admin@demo.com", Role.ADMIN, passwordHash);
        User manager = createUser("Sam Carter", "manager@demo.com", Role.MANAGER, passwordHash);
        User ava = createUser("Ava Fernando", "ava@demo.com", Role.MEMBER, passwordHash);
        User ben = createUser("Ben Silva", "ben@demo.com", Role.MEMBER, passwordHash);
        User chloe = createUser("Chloe Perera", "chloe@demo.com", Role.MEMBER, passwordHash);
        User dev = createUser("Dev Patel", "dev@demo.com", Role.MEMBER, passwordHash);
        User emma = createUser("Emma Jones", "emma@demo.com", Role.MEMBER, passwordHash);

        Project clientA = createProject("Client A Portal", "Customer-facing portal for Client A", List.of(ava, emma));
        Project tooling = createProject("Internal Tooling", "Tools and automation for the team", List.of(ben, dev));
        Project research = createProject("R&D", "Research spikes and prototypes", List.of(dev));
        Project marketing = createProject("Marketing Site", "Public website and landing pages", List.of(chloe, emma));

        reportSeeder.seed(manager, List.of(
                Map.entry(ava, clientA),
                Map.entry(ben, tooling),
                Map.entry(chloe, marketing),
                Map.entry(dev, research),
                Map.entry(emma, clientA)));

        log.info("Seeded demo users, projects and reports (password: {})", DEMO_PASSWORD);
    }

    private User createUser(String fullName, String email, Role role, String passwordHash) {
        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setRole(role);
        user.setPasswordHash(passwordHash);
        return userRepository.save(user);
    }

    private Project createProject(String name, String description, List<User> members) {
        Project project = new Project();
        project.setName(name);
        project.setDescription(description);
        project.getMembers().addAll(members);
        return projectRepository.save(project);
    }
}
