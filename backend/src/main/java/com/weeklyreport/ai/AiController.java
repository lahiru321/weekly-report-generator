package com.weeklyreport.ai;

import com.weeklyreport.ai.dto.AiReply;
import com.weeklyreport.ai.dto.AiStatus;
import com.weeklyreport.ai.dto.ChatRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/** AI assistant for managers. Lives under /api/manager, so SecurityConfig already limits it to MANAGER/ADMIN. */
@RestController
@RequestMapping("/api/manager/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @GetMapping("/status")
    public AiStatus status() {
        return new AiStatus(aiService.isEnabled());
    }

    @PostMapping("/summary")
    public AiReply summary(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate week) {
        return aiService.summary(week == null ? LocalDate.now() : week);
    }

    @PostMapping("/chat")
    public AiReply chat(@Valid @RequestBody ChatRequest request) {
        return aiService.chat(request.messages());
    }
}
