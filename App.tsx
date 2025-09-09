import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions, SafeAreaView } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import * as MediaLibrary from "expo-media-library";

const { width, height } = Dimensions.get("window");

export default function App() {
  // Camera permission
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Media Library permission
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState(false);

  // Camera state
  const cameraRef = useRef<CameraView | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flashMode, setFlashMode] = useState<"off" | "on">("off");

  // Photo
  const [image, setImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Ask media library permission once
  useEffect(() => {
    (async () => {
      const ml = await MediaLibrary.requestPermissionsAsync();
      setHasMediaLibraryPermission(ml.granted);
    })();
  }, []);

  // ---- Permission UIs ----
  if (!cameraPermission) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionText}>กำลังโหลดสิทธิ์การใช้กล้อง...</Text>
      </SafeAreaView>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Text style={styles.permissionTitle}>อนุญาตการใช้งานกล้อง</Text>
          <Text style={styles.permissionSubtitle}>เราต้องการสิทธิ์ในการใช้กล้องเพื่อถ่ายรูป</Text>
          <TouchableOpacity
            onPress={requestCameraPermission}
            style={styles.permissionButton}
          >
            <Text style={styles.permissionButtonText}>อนุญาต</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasMediaLibraryPermission) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionText}>กำลังขอสิทธิ์การเข้าถึงอัลบั้มรูป...</Text>
      </SafeAreaView>
    );
  }

  // ---- Preview screen ----
  if (image) {
    return (
      <SafeAreaView style={styles.previewContainer}>
        <StatusBar style="light" />
        
        {/* Header */}
        <View style={styles.previewHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setImage(null)}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.previewTitle}>รูปถ่าย</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Image Preview */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.previewImage} />
        </View>

        {/* Bottom Controls */}
        <View style={styles.previewControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setImage(null)}
          >
            <Text style={styles.controlIcon}>🔄</Text>
            <Text style={styles.controlLabel}>ถ่ายใหม่</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.saveButton]}
            onPress={async () => {
              try {
                await MediaLibrary.saveToLibraryAsync(image);
                setImage(null);
              } catch (error) {
                console.error("Save error:", error);
              }
            }}
          >
            <Text style={styles.saveIcon}>💾</Text>
            <Text style={styles.saveLabel}>บันทึก</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Take picture ----
  const handleTakePicture = async () => {
    if (!isCameraReady || !cameraRef.current || isCapturing) return;
    
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ 
        quality: 1,
        skipProcessing: false,
        exif: false
      });
      setImage(photo.uri);
    } catch (err) {
      console.error("Capture error:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  // ---- Camera screen ----
  return (
    <SafeAreaView style={styles.cameraContainer}>
      <StatusBar style="light" />
      
      {/* Camera View */}
      <View style={styles.cameraWrapper}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flashMode}
          onCameraReady={() => setIsCameraReady(true)}
          onMountError={(e) => console.warn("Camera mount error:", e)}
        />
        
        {/* Camera Overlay */}
        <View style={styles.cameraOverlay}>
          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <View style={styles.controlRow}>
              {/* Switch Camera Button */}
              <TouchableOpacity
                style={styles.sideControl}
                onPress={() => setFacing(facing === "back" ? "front" : "back")}
              >
                <Text style={styles.sideControlIcon}>🔄</Text>
              </TouchableOpacity>

              {/* Shutter Button */}
              <TouchableOpacity
                style={[
                  styles.shutterButton,
                  !isCameraReady && styles.shutterButtonDisabled,
                  isCapturing && styles.shutterButtonCapturing
                ]}
                disabled={!isCameraReady || isCapturing}
                onPress={handleTakePicture}
              >
                <View style={styles.shutterInner}>
                  {isCapturing ? (
                    <Text style={styles.shutterText}>...</Text>
                  ) : (
                    <Text style={styles.shutterIcon}>📸</Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Flash Button */}
              <TouchableOpacity
                style={[
                  styles.sideControl,
                  styles.flashButton,
                  flashMode === "on" && styles.flashButtonActive
                ]}
                onPress={() => setFlashMode(flashMode === "off" ? "on" : "off")}
              >
                <Text style={styles.sideControlIcon}>
                  {flashMode === "on" ? "⚡" : "🌙"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      
      {/* Camera Status */}
      {!isCameraReady && (
        <View style={styles.statusOverlay}>
          <Text style={styles.statusText}>กำลังเตรียมกล้อง...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Permission Styles
  permissionContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  permissionContent: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  permissionSubtitle: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 22,
  },
  permissionText: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  // Camera Styles
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraWrapper: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
  },

  // Bottom Controls
  bottomControls: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sideControl: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  sideControlIcon: {
    fontSize: 28,
  },

  // Flash Button Styles
  flashButton: {
    backgroundColor: "rgba(255, 193, 7, 0.2)",
  },
  flashButtonActive: {
    backgroundColor: "rgba(255, 193, 7, 0.8)",
    borderColor: "#ffc107",
  },

  // Shutter Button
  shutterButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 6,
    borderColor: "rgba(255, 255, 255, 0.3)",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  shutterButtonDisabled: {
    opacity: 0.5,
    backgroundColor: "#ccc",
  },
  shutterButtonCapturing: {
    backgroundColor: "#007AFF",
    transform: [{ scale: 0.95 }],
  },
  shutterInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterIcon: {
    fontSize: 32,
  },
  shutterText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },

  // Status Overlay
  statusOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },

  // Preview Styles
  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  previewTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  previewImage: {
    width: width - 40,
    height: (width - 40) * 1.33,
    borderRadius: 20,
    backgroundColor: "#111",
  },
  previewControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 30,
    paddingHorizontal: 40,
  },
  controlButton: {
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    minWidth: 100,
  },
  saveButton: {
    backgroundColor: "rgba(52, 199, 89, 0.8)",
  },
  controlIcon: {
    fontSize: 28,
    marginBottom: 5,
  },
  saveIcon: {
    fontSize: 28,
    marginBottom: 5,
  },
  controlLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  saveLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});