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
    minHeight: 24,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f97316",
    alignItems: "center",
    minHeight: 26,
  },
  tableHeaderCell: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "bold",
    padding: 6,
    flex: 1,
  },
  tableCell: {
    fontSize: 9,
    color: "#374151",
    padding: 6,
    flex: 1,
  },
  labelCell: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#4b5563",
    backgroundColor: "#f9f8f6",
    padding: 6,
    width: 120,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },
  valueCell: {
    fontSize: 10,
    color: "#1f2937",
    padding: 6,
    flex: 1,
  },
  detailRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  gridCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 10,
    marginRight: 10,
    alignItems: "center",
  },
  gridCardLast: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 10,
    alignItems: "center",
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#f97316",
    marginTop: 4,
  },
  cardLabel: {
    fontSize: 9,
    color: "#6b7280",
    textTransform: "uppercase",
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

interface MemberReportProps {
  gymName: string;
  member: {
    name: string;
    email?: string;
    mobile: string;
    joinDate: string;
    plan: string;
    status: string;
    attendance?: {
      totalDays: number;
      presentThisMonth: number;
      streak: number;
    };
    payments?: Array<{
      date: string;
      amount: number;
      plan: string;
      status: string;
    }>;
  };
  generatedAt: string;
}

export default function MemberReport({ gymName, member, generatedAt }: MemberReportProps) {
  const attendance = member.attendance || {
    totalDays: 20,
    presentThisMonth: 12,
    streak: 5,
  };

  const payments = member.payments || [];

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
            <Text style={styles.reportTitle}>Member Profile Report</Text>
          </View>
        </View>

        {/* Section 1: Member Details */}
        <Text style={styles.sectionTitle}>Member Details</Text>
        <View style={styles.table}>
          <View style={styles.detailRow}>
            <Text style={styles.labelCell}>Name</Text>
            <Text style={styles.valueCell}>{member.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.labelCell}>Email</Text>
            <Text style={styles.valueCell}>{member.email || "N/A"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.labelCell}>Phone</Text>
            <Text style={styles.valueCell}>{member.mobile}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.labelCell}>Join Date</Text>
            <Text style={styles.valueCell}>{member.joinDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.labelCell}>Active Plan</Text>
            <Text style={styles.valueCell}>{member.plan}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.labelCell}>Status</Text>
            <Text
              style={[
                styles.valueCell,
                { color: member.status === "Active" ? "#22c55e" : "#ef4444", fontWeight: "bold" },
              ]}
            >
              {member.status}
            </Text>
          </View>
        </View>

        {/* Section 2: Attendance Summary */}
        <Text style={styles.sectionTitle}>Attendance Summary</Text>
        <View style={styles.grid}>
          <View style={styles.gridCard}>
            <Text style={styles.cardLabel}>Total Days Present</Text>
            <Text style={styles.cardValue}>{attendance.totalDays}</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={styles.cardLabel}>Present This Month</Text>
            <Text style={styles.cardValue}>{attendance.presentThisMonth}</Text>
          </View>
          <View style={styles.gridCardLast}>
            <Text style={styles.cardLabel}>Current Streak</Text>
            <Text style={styles.cardValue}>{attendance.streak} Days</Text>
          </View>
        </View>

        {/* Section 3: Payment History */}
        <Text style={styles.sectionTitle}>Payment History</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Date</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Plan Name</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Amount</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Status</Text>
          </View>
          {payments.length === 0 ? (
            <View style={[styles.tableRow, { justifyContent: "center", minHeight: 30, borderBottomWidth: 0 }]}>
              <Text style={{ fontSize: 9, color: "#6b7280" }}>No payment records found.</Text>
            </View>
          ) : (
            payments.map((payment, i) => (
              <View
                key={i}
                style={[
                  styles.tableRow,
                  i === payments.length - 1 ? { borderBottomWidth: 0 } : {},
                ]}
              >
                <Text style={[styles.tableCell, { flex: 1.2 }]}>{payment.date}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{payment.plan}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>₹{payment.amount.toLocaleString("en-IN")}</Text>
                <Text
                  style={[
                    styles.tableCell,
                    {
                      flex: 1,
                      textAlign: "right",
                      color: payment.status === "Paid" ? "#22c55e" : "#f97316",
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {payment.status}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by {gymName} Management System</Text>
          <Text style={styles.footerText}>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
}
