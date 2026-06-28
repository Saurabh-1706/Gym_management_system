import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#f97316",
    paddingBottom: 15,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gymTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f97316",
  },
  reportTitle: {
    fontSize: 14,
    color: "#4b5563",
    fontWeight: "bold",
  },
  dateText: {
    fontSize: 9,
    color: "#9ca3af",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#f97316",
    marginBottom: 8,
    marginTop: 15,
    textTransform: "uppercase",
  },
  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    marginBottom: 15,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    alignItems: "center",
    minHeight: 22,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f97316",
    alignItems: "center",
    minHeight: 24,
  },
  tableHeaderCell: {
    fontSize: 9,
    color: "#ffffff",
    fontWeight: "bold",
    padding: 5,
    flex: 1,
  },
  tableCell: {
    fontSize: 8,
    color: "#374151",
    padding: 5,
    flex: 1,
  },
  warnText: {
    color: "#ef4444",
    fontWeight: "bold",
  },
  summaryText: {
    fontSize: 9,
    color: "#4b5563",
    marginBottom: 15,
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
  },
});

interface AttendanceReportProps {
  gymName: string;
  from: string;
  to: string;
  records: Array<{
    memberName: string;
    totalPresent: number;
    totalAbsent: number;
    rate: number; // percentage
  }>;
  generatedAt: string;
}

export default function AttendanceReport({
  gymName,
  from,
  to,
  records,
  generatedAt,
}: AttendanceReportProps) {
  const lowAttendanceCount = records.filter((r) => r.rate < 50).length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.gymTitle}>{gymName}</Text>
            <Text style={styles.dateText}>Generated on {generatedAt}</Text>
          </View>
          <View>
            <Text style={styles.reportTitle}>Attendance Analytics Report</Text>
            <Text style={[styles.dateText, { textAlign: "right" }]}>
              Range: {from} to {to}
            </Text>
          </View>
        </View>

        {/* Section 1: Brief Analytics Summary */}
        <Text style={styles.sectionTitle}>Attendance Insights</Text>
        <Text style={styles.summaryText}>
          During this period, we monitored attendance logs across your member base. A total of{" "}
          {records.length} athletes have active records. There are currently{" "}
          {lowAttendanceCount} members performing below the target 50% attendance threshold. These
          individuals have been highlighted in red below for trainer review and engagement.
        </Text>

        {/* Section 2: Attendance Table */}
        <Text style={styles.sectionTitle}>Member Attendance Details</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Member Name</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "center" }]}>Days Present</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "center" }]}>Days Absent</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Attendance %</Text>
          </View>
          {records.length === 0 ? (
            <View style={[styles.tableRow, { justifyContent: "center", minHeight: 30, borderBottomWidth: 0 }]}>
              <Text style={{ fontSize: 9, color: "#6b7280" }}>No attendance logs for this range.</Text>
            </View>
          ) : (
            records.map((rec, i) => {
              const isLow = rec.rate < 50;
              return (
                <View
                  key={i}
                  style={[
                    styles.tableRow,
                    i === records.length - 1 ? { borderBottomWidth: 0 } : {},
                  ]}
                >
                  <Text style={[styles.tableCell, { flex: 2 }, isLow ? styles.warnText : {}]}>
                    {rec.memberName} {isLow ? "⚠️" : ""}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: "center" }]}>
                    {rec.totalPresent}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: "center" }]}>
                    {rec.totalAbsent}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { flex: 1, textAlign: "right" },
                      isLow ? styles.warnText : { color: "#22c55e", fontWeight: "bold" },
                    ]}
                  >
                    {rec.rate.toFixed(1)}%
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by {gymName} High-Performance Telemetry</Text>
          <Text style={styles.footerText}>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
}
