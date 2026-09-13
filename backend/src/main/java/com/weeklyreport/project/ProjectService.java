package com.weeklyreport.project;

import com.weeklyreport.common.ApiException;
import com.weeklyreport.project.dto.ProjectRequest;
import com.weeklyreport.project.dto.ProjectResponse;
import com.weeklyreport.user.User;
import com.weeklyreport.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;

import static com.weeklyreport.common.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ProjectResponse> list() {
        return projectRepository.findAll(Sort.by("name")).stream()
                .map(ProjectResponse::from)
                .toList();
    }

    @Transactional
    public ProjectResponse create(ProjectRequest request) {
        String name = request.name().trim();
        if (projectRepository.existsByNameIgnoreCase(name)) {
            throw ApiException.conflict("A project with this name already exists");
        }

        Project project = new Project();
        applyRequest(project, name, request);
        return ProjectResponse.from(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse update(Long id, ProjectRequest request) {
        Project project = findProject(id);
        String name = request.name().trim();
        if (projectRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw ApiException.conflict("A project with this name already exists");
        }

        applyRequest(project, name, request);
        return ProjectResponse.from(project);
    }

    /** Reports tagged with this project keep existing; their project is set to empty by the database. */
    @Transactional
    public void delete(Long id) {
        projectRepository.delete(findProject(id));
    }

    private void applyRequest(Project project, String name, ProjectRequest request) {
        List<User> members = userRepository.findAllById(request.memberIds());
        if (members.size() != new HashSet<>(request.memberIds()).size()) {
            throw ApiException.badRequest("One or more selected members do not exist");
        }

        project.setName(name);
        project.setDescription(trimToNull(request.description()));
        project.getMembers().clear();
        project.getMembers().addAll(members);
    }

    private Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Project not found"));
    }
}
