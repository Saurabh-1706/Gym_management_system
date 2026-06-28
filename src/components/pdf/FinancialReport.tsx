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
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
    alignItems: "center",
  },
  summaryCardLast: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 8,
    alignItems: "center",
  },
  cardValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 4,
  },
  cardLabel: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    textAlign: "center",
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
  chartContainer: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 15,
    marginBottom: 15,
    height: 120,
    justifyContent: "flex-end",
  },
  chartTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#4b5563",
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  chartArea: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 80,
    paddingBottom: 5,
  },
  barWrapper: {
    alignItems: "center",
    width: 80,
  },
  bar: {
    width: 30,
    borderRadius: 2,
  },
  barLabel: {
    fontSize: 8,
    color: "#4b5563",
    marginTop: 4,
  },
  barValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#f97316",
    marginBottom: 2,
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

interface FinancialReportProps {
  gymName: string;
  month: string;
  year: string;
  summary: {
    totalRevenue: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
    categoryTotals: {
      membership: number;
      coachSalaries: number;
      expenses: number;
    };
  };
  transactions: Array<{
    memberName: string;
    plan: string;
    amount: number;
    date: string;
    status: string;
  }>;
  generatedAt: string;
}

export default function FinancialReport({
  gymName,
  month,
  year,
  summary,
  transactions,
  generatedAt,
}: FinancialReportProps) {
  // Simple scaling function for the bar chart
  const maxVal = Math.max(
    summary.categoryTotals.membership || 1,
    summary.categoryTotals.coachSalaries || 1,
    summary.categoryTotals.expenses || 1
  );

  const getBarHeight = (val: number) => {
    const minHeight = 5;
    const maxHeight = 55;
    return Math.max(minHeight, (val / maxVal) * maxHeight);
  };

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
            <Text style={styles.reportTitle}>Financial Summary Report</Text>
            <Text style={[styles.dateText, { textAlign: "right" }]}>
              Period: {month} {year}
            </Text>
          </View>
        </View>

        {/* Section 1: Summary Row */}
        <Text style={styles.sectionTitle}>Performance Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.cardLabel}>Total Revenue</Text>
            <Text style={[styles.cardValue, { color: "#22c55e" }]}>
              ₹{summary.totalRevenue.toLocaleString("en-IN")}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.cardLabel}>Paid Invoices</Text>
            <Text style={styles.cardValue}>{summary.paidCount}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.cardLabel}>Pending Invoices</Text>
            <Text style={[styles.cardValue, { color: "#f97316" }]}>
              {summary.pendingCount}
            </Text>
          </View>
          <View style={styles.summaryCardLast}>
            <Text style={styles.cardLabel}>Overdue Invoices</Text>
            <Text style={[styles.cardValue, { color: "#ef4444" }]}>
              {summary.overdueCount}
            </Text>
          </View>
        </View>

        {/* Section 2: Visual Chart */}
        <Text style={styles.sectionTitle}>Category Breakdown (INR)</Text>
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Monthly Financial Breakdown</Text>
          <View style={styles.chartArea}>
            {/* Membership Revenue Bar */}
            <View style={styles.barWrapper}>
              <Text style={styles.barValue}>
                ₹{summary.categoryTotals.membership.toLocaleString("en-IN")}
              </Text>
              <View
                style={[
                  styles.bar,
                  {
                    height: getBarHeight(summary.categoryTotals.membership),
                    backgroundColor: "#22c55e",
                  },
                ]}
              />
              <Text style={styles.barLabel}>Membership</Text>
            </View>

            {/* Coach Salaries Bar */}
            <View style={styles.barWrapper}>
              <Text style={styles.barValue}>
                ₹{summary.categoryTotals.coachSalaries.toLocaleString("en-IN")}
              </Text>
              <View
                style={[
                  styles.bar,
                  {
                    height: getBarHeight(summary.categoryTotals.coachSalaries),
                    backgroundColor: "#ef4444",
                  },
                ]}
              />
              <Text style={styles.barLabel}>Coaches</Text>
            </View>

            {/* Expenses Bar */}
            <View style={styles.barWrapper}>
              <Text style={styles.barValue}>
                ₹{summary.categoryTotals.expenses.toLocaleString("en-IN")}
              </Text>
              <View
                style={[
                  styles.bar,
                  {
                    height: getBarHeight(summary.categoryTotals.expenses),
                    backgroundColor: "#f97316",
                  },
                ]}
              />
              <Text style={styles.barLabel}>Expenses</Text>
            </View>
          </View>
        </View>

        {/* Section 3: Transactions Table */}
        <Text style={styles.sectionTitle}>Transactions Log</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Member Name</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Plan Details</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Amount</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Date</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: "right" }]}>Status</Text>
          </View>
          {transactions.length === 0 ? (
            <View style={[styles.tableRow, { justifyContent: "center", minHeight: 30, borderBottomWidth: 0 }]}>
              <Text style={{ fontSize: 9, color: "#6b7280" }}>No transaction records for this period.</Text>
            </View>
          ) : (
            transactions.map((tx, i) => (
              <View
                key={i}
                style={[
                  styles.tableRow,
                  i === transactions.length - 1 ? { borderBottomWidth: 0 } : {},
                ]}
              >
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{tx.memberName}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{tx.plan}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  ₹{tx.amount.toLocaleString("en-IN")}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.2 }]}>{tx.date}</Text>
                <Text
                  style={[
                    styles.tableCell,
                    {
                      flex: 0.8,
                      textAlign: "right",
                      color: tx.status === "Paid" ? "#22c55e" : "#ef4444",
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {tx.status}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by {gymName} Financial Ledger</Text>
          <Text style={styles.footerText}>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
}
