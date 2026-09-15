package com.weeklyreport.ai;

import com.weeklyreport.ai.dto.ChatMessage;
import com.weeklyreport.common.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class AiServiceTest {

    private final TeamContextBuilder contextBuilder = mock(TeamContextBuilder.class);

    @Test
    void withoutApiKeyTheAssistantIsDisabledAndNoDataIsLoaded() {
        AiService service = new AiService(contextBuilder, "", "claude-opus-5", 4);

        assertThat(service.isEnabled()).isFalse();
        assertStatus(() -> service.chat(List.of(new ChatMessage("user", "Hi"))), HttpStatus.SERVICE_UNAVAILABLE);
        assertStatus(() -> service.summary(LocalDate.of(2026, 9, 7)), HttpStatus.SERVICE_UNAVAILABLE);
        verifyNoInteractions(contextBuilder);
    }

    @Test
    void lastMessageMustComeFromTheUser() {
        AiService service = new AiService(contextBuilder, "", "claude-opus-5", 4);

        assertStatus(() -> service.chat(List.of(new ChatMessage("assistant", "Hello"))), HttpStatus.BAD_REQUEST);
    }

    private static void assertStatus(Runnable call, HttpStatus expected) {
        assertThatThrownBy(call::run)
                .isInstanceOf(ApiException.class)
                .extracting(ex -> ((ApiException) ex).getStatus())
                .isEqualTo(expected);
    }
}
