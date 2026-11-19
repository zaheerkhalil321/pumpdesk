import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import * as WebBrowser from 'expo-web-browser';
import { Edit2 } from 'lucide-react-native';
import { Screen, NavyHeader, AppText, TextField, Button } from '@/components/ui';
import { useJob } from '@/hooks/useJobs';
import { useTicket, useSaveTicket } from '@/hooks/useTicket';
import { useTheme } from '@/theme';
import { lightColors } from '@/theme/colors';

export default function SignatureCaptureScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const { colors, iconSizes, radius } = useTheme();

  const { data: job } = useJob(jobId);
  const { data: ticket } = useTicket(jobId);
  const saveTicketMutation = useSaveTicket();

  const signatureRef = useRef<SignatureViewRef>(null);

  const defaultCustomer = job?.customerName || '';
  const [signerName, setSignerName] = useState(ticket?.signerName || defaultCustomer);
  const [signatureData, setSignatureData] = useState<string | null>(ticket?.signaturePng || null);

  const jobSubtitle = `${job?.jobName || defaultCustomer} · ${job?.site.street || job?.site.label || ''}`;

  const handleOK = (signature: string) => {
    setSignatureData(signature);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setSignatureData(null);
  };

  const handleOpenTerms = async () => {
    const termsUrl = job?.shop?.label ? 'https://midcoastconcrete.com/terms' : 'https://pumpdesk.com/terms';
    await WebBrowser.openBrowserAsync(termsUrl).catch(() => {});
  };

  const handleSave = async () => {
    if (!signerName.trim() || !signatureData || !jobId) return;

    if (ticket) {
      await saveTicketMutation.mutateAsync({
        ...ticket,
        signerName: signerName.trim(),
        signaturePng: signatureData,
        signedAt: new Date().toISOString(),
      });
    } else {
      await saveTicketMutation.mutateAsync({
        jobId,
        arrivedOnSiteAt: job?.steps.arrived_site || null,
        startedPourAt: null,
        finishedPourAt: null,
        departedSiteAt: job?.steps.departed_site || null,
        yardsPumped: null,
        hose3inFt: null,
        hose4inFt: null,
        extras: [],
        comments: '',
        signerName: signerName.trim(),
        signaturePng: signatureData,
        signedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    router.back();
  };

  const isSaveDisabled = !signerName.trim() || !signatureData;

  const styleCanvas = `
    .m-signature-pad { box-shadow: none; border: none; background-color: #FFFFFF; }
    .m-signature-pad--body { border: none; background-color: #FFFFFF; }
    .m-signature-pad--footer { display: none; }
    body, html { width: 100%; height: 100%; background-color: #FFFFFF; }
  `;

  return (
    <View style={styles.root}>
      <NavyHeader
        backLabel="Job"
        onBack={() => router.back()}
        heading="Customer signature"
        subheading={jobSubtitle}
      />

      <Screen
        scroll
        padded
        headerBackground="navy"
        keyboardAvoiding
        contentContainerStyle={styles.content}
      >
        {/* Customer Name Field */}
        <TextField
          label="Customer name"
          value={signerName}
          onChangeText={setSignerName}
          placeholder="Customer name"
          helperText="Tap to edit if someone else is signing"
          rightIcon={<Edit2 size={iconSizes.sm} color={colors.mutedForeground} />}
        />

        {/* Signature Pad */}
        <View style={styles.padSection}>
          <View
            style={[
              styles.padContainer,
              {
                backgroundColor: lightColors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
              },
            ]}
          >
            <SignatureScreen
              ref={signatureRef}
              onOK={handleOK}
              onEnd={() => signatureRef.current?.readSignature()}
              webStyle={styleCanvas}
              dataURL={signatureData || undefined}
            />

            {!signatureData ? (
              <View style={styles.signHereOverlay} pointerEvents="none">
                <AppText variant="body" style={[styles.signHereText, { color: lightColors.mutedForeground }]}>
                  Sign here
                </AppText>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Clear signature"
            >
              <AppText variant="small" style={{ color: lightColors.link }}>
                Clear
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Terms Link */}
        <View style={styles.termsRow}>
          <TouchableOpacity
            onPress={handleOpenTerms}
            accessibilityRole="button"
            accessibilityLabel="Terms and conditions"
          >
            <AppText variant="small" tone="link">
              Terms & conditions
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <View style={styles.bottomSection}>
          <Button
            label="Save signature"
            variant="primary"
            size="lg"
            disabled={isSaveDisabled}
            onPress={handleSave}
          />
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 20,
  },
  root: {
    flex: 1,
  },
  headerInfo: {
    marginTop: 16,
    marginBottom: 20,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    lineHeight: 20,
  },
  padSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  padContainer: {
    height: 240,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
  },
  signHereOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signHereText: {
    opacity: 0.6,
  },
  clearButton: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    padding: 6,
  },
  termsRow: {
    alignItems: 'flex-start',
    marginVertical: 12,
  },
  bottomSection: {
    marginTop: 16,
    marginBottom: 40,
  },
});
