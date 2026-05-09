package com.hp.automation.utils;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import java.io.InputStreamReader;
import java.io.Reader;

public class TestDataReader {
    private static final JsonObject data;

    static {
        try (Reader reader = new InputStreamReader(
                Thread.currentThread().getContextClassLoader()
                        .getResourceAsStream("testdata.json"))) {
            data = new Gson().fromJson(reader, JsonObject.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load testdata.json", e);
        }
    }

    public static String getString(String key) {
        return data.get(key).getAsString();
    }

    public static int getInt(String key) {
        return data.get(key).getAsInt();
    }
}