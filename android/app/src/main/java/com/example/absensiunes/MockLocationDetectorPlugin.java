package com.example.absensiunes;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;

/**
 * Capacitor Plugin untuk mendeteksi penggunaan Mock Location / Fake GPS
 * 
 * Strategi deteksi:
 * 1. Cek apakah Mock Location diaktifkan di Developer Options
 * 2. Cek apakah Developer Options diaktifkan
 * 3. Cek aplikasi FakeGPS/Mock Location yang terinstall
 * 4. Cek flag isMocked pada Location object (API 31+)
 * 5. Cek Mock Location Provider
 */
@CapacitorPlugin(name = "MockLocationDetector")
public class MockLocationDetectorPlugin extends Plugin {

    // Daftar package name aplikasi FakeGPS yang umum digunakan
    private static final String[] KNOWN_MOCK_APPS = {
        // Fake GPS apps
        "com.lexa.fakegps",
        "com.blogspot.newapphorizons.fakegps",
        "com.theappninjas.gpsjoystick",
        "com.incorporateapps.fakegps.fre",
        "com.fakegps.mock",
        "com.evezzon.fakegps",
        "com.gsmartstudio.fakegps",
        "com.lkr.fakelocation",
        "com.fake.gps.location",
        "com.rosteam.gpsemulator",
        "com.divi.fakeGPS",
        "com.pe.fakegpsrun",
        "org.hola.gpslocation",
        "com.byterev.bytefakegpslocation",
        "com.location.changer",
        "com.fakegps.joystick",
        "com.lexa.fakegps.pro",
        "com.ltp.fakegps",
        "com.ltp.pro.fakelocation",
        "com.mock.location",
        "ru.gavrikov.mocklocations",
        "com.blogspot.newapphorizons.fakegpspro",
        "com.fake.location",
        "com.usefullapps.fakegpslocationpro",
        "com.gsmartstudio.fakegpspro",
        "location.changer.fake.gps.location",
        "fake.gps.location.changer",
        "com.fakegps.route",
        "com.fake.gps.go",
        "com.rosteam.gpsemulatorpro",
        "com.marlon.floating.fake.location",
        "com.divi.fakeGPSpro",
        "com.fake.gps.location.free",
        "com.tselofan.fgps",
        "com.ninjatools.fakegpslocation",
        "com.fakegps.joystick.pro",
        "location.fake.changer.gps",
        "fake.gps.location.spoof",
        "com.gps.fake.route",
        "com.fakegps",
        // GPS Spoofing apps
        "com.gps.spoofing",
        "gps.spoofing.location",
        // Mock GPS apps
        "com.mock.gps",
        "mock.gps.location",
        "com.mockgps.fake.location",
        // Xposed/Root-related spoofing
        "com.xposed.fakegps",
        "de.robv.android.xposed.installer",
        // VPN-based location spoofing
        "com.nordvpn.android", // Beberapa VPN punya fitur lokasi palsu
        // Developer tools yang bisa digunakan untuk spoof
        "com.android.developer.options",
    };

    @PluginMethod
    public void checkMockLocation(PluginCall call) {
        Context context = getContext();
        JSObject result = new JSObject();
        
        boolean isMocked = false;
        boolean isMockLocationEnabled = false;
        boolean isDeveloperOptionsEnabled = false;
        List<String> installedMockApps = new ArrayList<>();

        try {
            // 1. Cek Developer Options
            isDeveloperOptionsEnabled = isDeveloperOptionsEnabled(context);

            // 2. Cek Mock Location setting di Developer Options
            isMockLocationEnabled = isMockLocationSettingEnabled(context);

            // 3. Cek aplikasi FakeGPS yang terinstall
            installedMockApps = getInstalledMockApps(context);

            // 4. Cek Mock Location Provider aktif
            boolean hasMockProvider = hasMockLocationProvider(context);

            // 5. Tentukan apakah terdeteksi menggunakan mock location
            // Flagging jika: mock setting aktif, atau mock provider aktif, atau ada mock apps terinstall
            isMocked = isMockLocationEnabled || hasMockProvider;
            
            // Jika ada aplikasi mock terinstall DAN developer options aktif, anggap high risk
            if (!installedMockApps.isEmpty() && isDeveloperOptionsEnabled) {
                isMocked = true;
            }

        } catch (Exception e) {
            // Log error but don't crash
            android.util.Log.e("MockLocationDetector", "Error checking mock location: " + e.getMessage());
        }

        // Prepare result
        result.put("isMocked", isMocked);
        result.put("isMockLocationEnabled", isMockLocationEnabled);
        result.put("isDeveloperOptionsEnabled", isDeveloperOptionsEnabled);
        
        JSArray mockAppsArray = new JSArray();
        for (String app : installedMockApps) {
            mockAppsArray.put(app);
        }
        result.put("mockApps", mockAppsArray);

        call.resolve(result);
    }

    /**
     * Cek apakah Developer Options diaktifkan
     */
    private boolean isDeveloperOptionsEnabled(Context context) {
        try {
            int devOptionsEnabled = Settings.Secure.getInt(
                context.getContentResolver(),
                Settings.Global.DEVELOPMENT_SETTINGS_ENABLED,
                0
            );
            return devOptionsEnabled == 1;
        } catch (Exception e) {
            // Fallback untuk device lama
            try {
                int devOptionsEnabled = Settings.Secure.getInt(
                    context.getContentResolver(),
                    "development_settings_enabled",
                    0
                );
                return devOptionsEnabled == 1;
            } catch (Exception ex) {
                return false;
            }
        }
    }

    /**
     * Cek apakah Mock Location diaktifkan di Developer Options
     */
    private boolean isMockLocationSettingEnabled(Context context) {
        try {
            // Untuk API < 23
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
                String mockLocationApp = Settings.Secure.getString(
                    context.getContentResolver(),
                    "mock_location"
                );
                return mockLocationApp != null && !mockLocationApp.isEmpty() && !"0".equals(mockLocationApp);
            }
            
            // Untuk API >= 23, cek mock location apps
            String mockLocationApp = Settings.Secure.getString(
                context.getContentResolver(),
                Settings.Secure.ALLOW_MOCK_LOCATION
            );
            return mockLocationApp != null && !mockLocationApp.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Cek apakah ada Mock Location Provider yang aktif
     */
    private boolean hasMockLocationProvider(Context context) {
        try {
            LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
            if (locationManager == null) return false;

            // Cek GPS provider
            try {
                Location gpsLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                if (gpsLocation != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        // API 31+ - langsung cek isMock()
                        if (gpsLocation.isMock()) {
                            return true;
                        }
                    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) {
                        // API 18-30 - gunakan isFromMockProvider()
                        if (gpsLocation.isFromMockProvider()) {
                            return true;
                        }
                    }
                }
            } catch (SecurityException ignored) {}

            // Cek Network provider
            try {
                Location networkLocation = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                if (networkLocation != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        if (networkLocation.isMock()) {
                            return true;
                        }
                    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) {
                        if (networkLocation.isFromMockProvider()) {
                            return true;
                        }
                    }
                }
            } catch (SecurityException ignored) {}

            // Cek apakah ada test provider
            for (String provider : locationManager.getAllProviders()) {
                try {
                    // Coba deteksi test provider dengan cara lain
                    if (provider.contains("test") || provider.contains("mock")) {
                        return true;
                    }
                } catch (Exception ignored) {}
            }

        } catch (Exception e) {
            android.util.Log.e("MockLocationDetector", "Error checking mock provider: " + e.getMessage());
        }
        return false;
    }

    /**
     * Cek aplikasi FakeGPS yang terinstall
     */
    private List<String> getInstalledMockApps(Context context) {
        List<String> installedMockApps = new ArrayList<>();
        PackageManager pm = context.getPackageManager();

        for (String packageName : KNOWN_MOCK_APPS) {
            try {
                ApplicationInfo appInfo = pm.getApplicationInfo(packageName, 0);
                if (appInfo != null && appInfo.enabled) {
                    // Dapatkan nama aplikasi untuk display
                    String appName = pm.getApplicationLabel(appInfo).toString();
                    installedMockApps.add(appName + " (" + packageName + ")");
                }
            } catch (PackageManager.NameNotFoundException ignored) {
                // Aplikasi tidak terinstall - ini bagus
            }
        }

        // Tambahan: cari aplikasi dengan keyword tertentu di nama
        try {
            List<ApplicationInfo> installedApps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
            for (ApplicationInfo appInfo : installedApps) {
                String packageName = appInfo.packageName.toLowerCase();
                String appName = pm.getApplicationLabel(appInfo).toString().toLowerCase();
                
                // Skip system apps (kecuali developer tools)
                if ((appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0) {
                    continue;
                }
                
                // Cek keyword yang mencurigakan
                if (containsMockKeyword(packageName) || containsMockKeyword(appName)) {
                    String displayName = pm.getApplicationLabel(appInfo).toString();
                    String entry = displayName + " (" + appInfo.packageName + ")";
                    if (!installedMockApps.contains(entry)) {
                        installedMockApps.add(entry);
                    }
                }
            }
        } catch (Exception ignored) {}

        return installedMockApps;
    }

    /**
     * Cek apakah string mengandung keyword yang terkait mock location
     */
    private boolean containsMockKeyword(String text) {
        String[] keywords = {
            "fakegps", "fake gps", "fake_gps",
            "mocklocation", "mock location", "mock_location",
            "gpsspoof", "gps spoof", "gps_spoof",
            "locationspoof", "location spoof",
            "gpsjoystick", "gps joystick",
            "fakeposition", "fake position",
            "gpsfaker", "gps faker",
            "locationfaker", "location faker",
            "gpsemulator", "gps emulator",
            "locationchanger", "location changer"
        };
        
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Method untuk validasi lokasi secara realtime
     * Dipanggil setiap kali ada update lokasi untuk cek apakah dari mock provider
     */
    @PluginMethod
    public void validateLocation(PluginCall call) {
        double latitude = call.getDouble("latitude", 0.0);
        double longitude = call.getDouble("longitude", 0.0);
        double accuracy = call.getDouble("accuracy", 0.0);
        
        JSObject result = new JSObject();
        boolean isSuspicious = false;
        List<String> suspiciousReasons = new ArrayList<>();

        // Cek akurasi yang terlalu sempurna (< 1 meter sangat mencurigakan)
        if (accuracy > 0 && accuracy < 1.0) {
            isSuspicious = true;
            suspiciousReasons.add("Akurasi GPS terlalu sempurna (" + accuracy + "m)");
        }

        // Cek koordinat yang tidak valid
        if (latitude == 0.0 && longitude == 0.0) {
            isSuspicious = true;
            suspiciousReasons.add("Koordinat tidak valid (0,0)");
        }

        // Cek apakah koordinat berada di lokasi yang tidak mungkin (misal di laut, dll)
        // Ini bisa diperluas dengan geofencing atau peta

        result.put("isSuspicious", isSuspicious);
        JSArray reasonsArray = new JSArray();
        for (String reason : suspiciousReasons) {
            reasonsArray.put(reason);
        }
        result.put("reasons", reasonsArray);

        call.resolve(result);
    }
}
