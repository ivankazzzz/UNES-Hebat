package com.example.absensiunes;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register plugins before calling super.onCreate()
        registerPlugin(MockLocationDetectorPlugin.class);
        
        super.onCreate(savedInstanceState);
    }
}
