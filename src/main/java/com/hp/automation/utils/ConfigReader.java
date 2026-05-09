package com.hp.automation.utils;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class ConfigReader {
    private static final Properties properties = new Properties();

    static {
        try (InputStream is = ConfigReader.class.getClassLoader()
                .getResourceAsStream("config.properties")) {
            if (is == null) {
                // Fallback: load from test resources
                try (InputStream testIs = Thread.currentThread().getContextClassLoader()
                        .getResourceAsStream("config.properties")) {
                    if (testIs != null) properties.load(testIs);
                }
            } else {
                properties.load(is);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to load config.properties", e);
        }
    }

    public static String get(String key) {
        return properties.getProperty(key);
    }

    public static String get(String key, String defaultValue) {
        return properties.getProperty(key, defaultValue);
    }

    public static int getInt(String key, int defaultValue) {
        String val = properties.getProperty(key);
        return val != null ? Integer.parseInt(val) : defaultValue;
    }

    public static boolean getBoolean(String key, boolean defaultValue) {
        String val = properties.getProperty(key);
        return val != null ? Boolean.parseBoolean(val) : defaultValue;
    }
}