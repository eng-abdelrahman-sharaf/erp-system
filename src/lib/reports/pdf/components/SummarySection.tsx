import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { reportStyles } from "./styles";

export interface SummaryCardItem {
  label: string;
  value: string | number;
}

interface SummarySectionProps {
  title?: string;
  items: SummaryCardItem[];
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  title = "Summary Totals",
  items,
}) => {
  return (
    <View style={reportStyles.summaryContainer}>
      <Text style={reportStyles.sectionTitle}>{title}</Text>
      <View style={reportStyles.summaryGrid}>
        {items.map((item, index) => (
          <View key={index} style={reportStyles.summaryCard}>
            <Text style={reportStyles.summaryCardLabel}>{item.label}</Text>
            <Text style={reportStyles.summaryCardValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
