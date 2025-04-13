interface VersionInfo {
  version: string;
  buildTime: number;
}

// Get the initial version from the embedded version.json
let currentVersion: VersionInfo | null = null;

// Initialize the current version
export const initializeVersion = async (): Promise<void> => {
  try {
    const response = await fetch('/version.json', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    currentVersion = await response.json();

    // Store in localStorage for offline comparison
    localStorage.setItem('appVersion', JSON.stringify(currentVersion));
  } catch (error) {
    console.error('Failed to initialize version:', error);
    // Try to get version from localStorage as fallback
    const storedVersion = localStorage.getItem('appVersion');
    if (storedVersion) {
      currentVersion = JSON.parse(storedVersion);

    }
  }
};

export const checkForUpdates = async (): Promise<boolean> => {
  if (!currentVersion) {

    await initializeVersion();
  }

  try {

    // Fetch latest version with cache-busting query parameter
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const latestVersion: VersionInfo = await response.json();


    // If we don't have a current version, update it and return false
    if (!currentVersion) {
      currentVersion = latestVersion;
      localStorage.setItem('appVersion', JSON.stringify(currentVersion));

      return false;
    }

    // Compare build times to determine if there's an update
    const hasUpdate = latestVersion.buildTime > currentVersion.buildTime;

    return hasUpdate;
  } catch (error) {
    console.error('Version check failed:', error);
    return false;
  }
};
