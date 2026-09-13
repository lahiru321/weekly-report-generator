package com.weeklyreport.report;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A blocker or an achievement. One item per list can be flagged as the key one for the week. */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReportItem {

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "is_key", nullable = false)
    private boolean isKey;
}
