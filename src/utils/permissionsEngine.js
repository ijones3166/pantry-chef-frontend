import { useState, useEffect } from 'react';

export const useDevicePermissions = () => {
  const [permissions, setPermissions] = useState({
    camera: 'prompt', // 'granted' | 'denied' | 'prompt'
    audio: 'prompt',
  });

  // Check initial permission states on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (navigator.permissions && navigator.permissions.query) {
      try {
        // Check Camera
        const cameraPermission = await navigator.permissions.query({ name: 'camera' });
        // Check Microphone
        const audioPermission = await navigator.permissions.query({ name: 'microphone' });

        setPermissions({
          camera: cameraPermission.state,
          audio: audioPermission.state,
        });

        // Listen for live changes (e.g., if user resets permissions in browser settings)
        cameraPermission.onchange = () => {
          setPermissions(prev => ({ ...prev, camera: cameraPermission.state }));
        };
        audioPermission.onchange = () => {
          setPermissions(prev => ({ ...prev, audio: audioPermission.state }));
        };
      } catch (err) {
        console.warn("Permissions API query not fully supported on this environment:", err);
      }
    }
  };

  // Explicit request trigger with hardware probing fallback
  const requestPermission = async (type) => {
    try {
      if (type === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Clean up test stream immediately
        setPermissions(prev => ({ ...prev, camera: 'granted' }));
        return true;
      } else if (type === 'audio') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().exit(); // Clean up
        stream.getTracks().forEach(track => track.stop());
        setPermissions(prev => ({ ...prev, audio: 'granted' }));
        return true;
      }
    } catch (err) {
      console.error(`Permission denied for ${type}:`, err);
      setPermissions(prev => ({ ...prev, [type]: 'denied' }));
      return false;
    }
    return false;
  };

  return { permissions, requestPermission, checkPermissions };
};