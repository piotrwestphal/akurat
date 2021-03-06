package com.akurat

import com.akurat.model.Role
import com.akurat.profiles.CreateProfileRequest
import com.akurat.profiles.UpdateProfileRequest
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlinx.serialization.KSerializer
import kotlinx.serialization.json.Json
import org.assertj.core.api.Assertions.assertThat
import java.util.*

fun <T> testApp(testEngine: TestApplicationEngine.() -> T): T =
    withTestApplication(
        {
            appModule()
        },
        testEngine
    )

fun readFile(path: String): String =
    Objects.requireNonNull(object {}.javaClass.getResource(path)).readText()

private fun <T> stringify(serializer: KSerializer<T>, clazz: T): String =
    Json.encodeToString(serializer, clazz)

fun TestApplicationEngine.createProfile(name: String, role: Role): TestApplicationCall =
    handleRequest(HttpMethod.Post, "/api/v1/profiles") {
        val createProfileRequest = stringify(CreateProfileRequest.serializer(), CreateProfileRequest(name, role))
        addHeader(HttpHeaders.ContentType, ContentType.Application.Json.toString())
        setBody(createProfileRequest)
    }

fun TestApplicationEngine.updateProfile(id: String, name: String, role: Role): TestApplicationCall =
    handleRequest(HttpMethod.Patch, "/api/v1/profiles/$id") {
        val updateProfileRequest = stringify(UpdateProfileRequest.serializer(), UpdateProfileRequest(name, role))
        addHeader(HttpHeaders.ContentType, ContentType.Application.Json.toString())
        setBody(updateProfileRequest)
    }

fun TestApplicationEngine.createProfileAndGetId(name: String, role: Role): String =
    with(createProfile(name, role)) {
        assertThat(response.status()).isEqualTo(HttpStatusCode.Created)
        val locationHeader = response.headers["Location"]
        assertThat(locationHeader).contains("/api/v1/profiles/")
        locationHeader!!.split('/').last()
    }

fun TestApplicationEngine.createProfileFromJson(jsonPath: String): TestApplicationCall =
    handleRequest(HttpMethod.Post, "/api/v1/profiles") {
        val createProfileRequest = readFile(jsonPath)
        addHeader(HttpHeaders.ContentType, ContentType.Application.Json.toString())
        setBody(createProfileRequest)
    }

fun TestApplicationEngine.updateProfileFromJson(id: String, jsonPath: String): TestApplicationCall =
    handleRequest(HttpMethod.Patch, "/api/v1/profiles/$id") {
        val updateProfileRequest = readFile(jsonPath)
        addHeader(HttpHeaders.ContentType, ContentType.Application.Json.toString())
        setBody(updateProfileRequest)
    }