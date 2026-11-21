import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { reportStyles } from "./styles";

export const ReportFooter: React.FC = () => {
  return (
    <View style={reportStyles.footer} fixed>
      <Text style={reportStyles.footerText}>
        ERP System &bull; Confidential Business Document
      </Text>
      <Text
        style={reportStyles.footerPageNumber}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
};
