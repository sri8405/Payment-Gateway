import * as React from "react";

export interface DonationReceiptEmailProps {
  name: string;
  email: string;
  phone?: string;
  gothra?: string;
  seva: string;
  amount: number;
  receiptNumber: string;
  paymentId: string;
  transactionId: string;
  donationDate: string;
  templeName?: string;
}

export const DonationReceiptEmail: React.FC<Readonly<DonationReceiptEmailProps>> = ({
  name,
  gothra,
  seva,
  amount,
  receiptNumber,
  paymentId,
  transactionId,
  donationDate,
  templeName = "Sri Padmananda Guruji Ashrama",
}) => {
  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        backgroundColor: "#f9fafb",
        margin: 0,
        padding: "24px 12px",
        color: "#1f2937",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #f3f4f6",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        }}
      >
        {/* Header Header Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #c65910 0%, #d97706 100%)",
            padding: "32px 24px",
            textAlign: "center",
            color: "#ffffff",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              fontFamily: "Georgia, serif",
            }}
          >
            {templeName}
          </h1>
          <p
            style={{
              margin: "8px 0 0 0",
              fontSize: "14px",
              opacity: 0.9,
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            GuruSeva Donation Receipt
          </p>
        </div>

        {/* Content Body */}
        <div style={{ padding: "32px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#ecfdf5",
                color: "#047857",
                fontSize: "12px",
                fontWeight: 600,
                padding: "6px 16px",
                borderRadius: "9999px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Payment Confirmed ✓
            </span>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "#111827",
                margin: "12px 0 4px 0",
              }}
            >
              Namaste, {name}
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
              Thank you for your sacred seva offering. Here is your official donation receipt.
            </p>
          </div>

          {/* Receipt Details Box */}
          <div
            style={{
              backgroundColor: "#fffbeb",
              border: "1px solid #fef3c7",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "28px",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "6px 0", fontSize: "13px", color: "#92400e", fontWeight: 500 }}>
                    Receipt Number:
                  </td>
                  <td
                    style={{
                      padding: "6px 0",
                      fontSize: "14px",
                      color: "#78350f",
                      fontWeight: 700,
                      textAlign: "right",
                      fontFamily: "monospace",
                    }}
                  >
                    {receiptNumber}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", fontSize: "13px", color: "#92400e", fontWeight: 500 }}>
                    Booking ID:
                  </td>
                  <td
                    style={{
                      padding: "6px 0",
                      fontSize: "13px",
                      color: "#78350f",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    {transactionId}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", fontSize: "13px", color: "#92400e", fontWeight: 500 }}>
                    Razorpay Payment ID:
                  </td>
                  <td
                    style={{
                      padding: "6px 0",
                      fontSize: "13px",
                      color: "#78350f",
                      fontWeight: 600,
                      textAlign: "right",
                      fontFamily: "monospace",
                    }}
                  >
                    {paymentId}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", fontSize: "13px", color: "#92400e", fontWeight: 500 }}>
                    Date & Time:
                  </td>
                  <td
                    style={{
                      padding: "6px 0",
                      fontSize: "13px",
                      color: "#78350f",
                      fontWeight: 500,
                      textAlign: "right",
                    }}
                  >
                    {donationDate}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Devotee & Seva Table */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "28px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                <th
                  style={{
                    textAlign: "left",
                    paddingBottom: "10px",
                    fontSize: "12px",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Detail
                </th>
                <th
                  style={{
                    textAlign: "right",
                    paddingBottom: "10px",
                    fontSize: "12px",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Information
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "12px 0", fontSize: "14px", color: "#4b5563" }}>Devotee Name</td>
                <td style={{ padding: "12px 0", fontSize: "14px", color: "#111827", fontWeight: 600, textAlign: "right" }}>
                  {name}
                </td>
              </tr>
              {gothra && (
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 0", fontSize: "14px", color: "#4b5563" }}>Gothra</td>
                  <td style={{ padding: "12px 0", fontSize: "14px", color: "#111827", fontWeight: 500, textAlign: "right" }}>
                    {gothra}
                  </td>
                </tr>
              )}
              <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "12px 0", fontSize: "14px", color: "#4b5563" }}>Seva Offering</td>
                <td style={{ padding: "12px 0", fontSize: "14px", color: "#111827", fontWeight: 600, textAlign: "right" }}>
                  {seva}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "16px 0 0 0", fontSize: "16px", color: "#111827", fontWeight: 700 }}>
                  Total Amount Offered
                </td>
                <td
                  style={{
                    padding: "16px 0 0 0",
                    fontSize: "20px",
                    color: "#c65910",
                    fontWeight: 700,
                    textAlign: "right",
                  }}
                >
                  ₹{amount}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Blessing Message */}
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              backgroundColor: "#fdf8f6",
              borderRadius: "12px",
              border: "1px solid #f9ebea",
            }}
          >
            <p style={{ margin: 0, fontSize: "15px", color: "#9a3412", fontWeight: 500, fontStyle: "italic" }}>
              "Thank you for supporting our temple. May Lord bless you and your family with peace, health, and prosperity."
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: "#f9fafb",
            padding: "20px 24px",
            textAlign: "center",
            borderTop: "1px solid #f3f4f6",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
            This is an automated receipt generated by GuruSeva.
            <br />
            For any queries regarding this receipt, please contact the temple administration.
          </p>
        </div>
      </div>
    </div>
  );
};
