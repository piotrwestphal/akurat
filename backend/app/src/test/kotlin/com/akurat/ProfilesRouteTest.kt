package com.akurat

import com.akurat.model.ProfileResponse
import com.akurat.model.Role
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import org.assertj.core.api.Assertions.assertThat
import java.util.*
import kotlin.test.Test

internal class ProfilesRouteTest {

    @Test
    fun `GET auth - should authorize with simple credentials`() {
        testApp {
            with(handleRequest(HttpMethod.Get, "/protected/route/basic") {
                val credentials = Base64.getEncoder().encodeToString("West:West".toByteArray())
                addHeader("Authorization", "Basic $credentials")
            }) {
                assertThat(response.status()).isEqualTo(HttpStatusCode.OK)
                assertThat(response.content).isEqualTo("Hello West!")
            }
        }
    }

    @Test
    fun `GET - should retrieve all profiles`() {
        testApp {
            with(createProfile("Piotr West", Role.MODEL))
            { assertThat(response.status()).isEqualTo(HttpStatusCode.Created) }
            with(createProfile("Kate Carpenter", Role.DESIGNER))
            { assertThat(response.status()).isEqualTo(HttpStatusCode.Created) }
            with(handleRequest(HttpMethod.Get, "/api/v1/profiles")) {
                assertThat(response.status()).isEqualTo(HttpStatusCode.OK)
                assertThat(response.content).isNotNull

                val result = Json.decodeFromString<List<ProfileResponse>>(response.content!!)
                assertThat(result).hasSize(2)
                assertThat(result).extracting("name").containsExactly("Piotr West", "Kate Carpenter")
                assertThat(result).extracting("role").containsExactly(Role.MODEL.name, Role.DESIGNER.name)
            }
        }
    }

    @Test
    fun `GET - should receive an empty list`() {
        testApp {
            with(handleRequest(HttpMethod.Get, "/api/v1/profiles")) {
                assertThat(response.status()).isEqualTo(HttpStatusCode.OK)
                assertThat(response.content).isEqualToIgnoringWhitespace("[]")
            }
        }
    }

    @Test
    fun `GET {id} - should retrieve a profile`() {
        testApp {
            val createdId = createProfileAndGetId("West", Role.PHOTOGRAPHER)
            with(handleRequest(HttpMethod.Get, "/api/v1/profiles/$createdId")) {
                assertThat(response.status()).isEqualTo(HttpStatusCode.OK)
                assertThat(response.content).isNotNull

                val result = Json.decodeFromString<ProfileResponse>(response.content!!)
                assertThat(result.id).isEqualTo(createdId)
                assertThat(result.name).isEqualTo("West")
                assertThat(result.role).isEqualTo(Role.PHOTOGRAPHER.name)
                assertThat(result.createdAt).isNotNull
            }
        }
    }

    @Test
    fun `GET {id} (error) - should receive an error message when retrieving profile with 'id' in wrong format`() {
        testApp {
            val wrongUuid = "ff1a116e-3e3a-4e62-ba49-6b990c96590"
            with(handleRequest(HttpMethod.Get, "/api/v1/profiles/$wrongUuid")) {
                val expectedErrorMessage = readFile("/json/error_profile_wrong_id_format.json")
                assertThat(response.status()).isEqualTo(HttpStatusCode.BadRequest)
                assertThat(response.content).isEqualToIgnoringWhitespace(expectedErrorMessage)
            }
        }
    }

    @Test
    fun `GET {id} (error) - should receive an error message when there is no profile with given id`() {
        testApp {
            val uuid = "ff1a116e-3e3a-4e62-ba49-6b9904c96590"
            with(handleRequest(HttpMethod.Get, "/api/v1/profiles/$uuid")) {
                val expectedErrorMessage = readFile("/json/error_profile_not_found.json")
                assertThat(response.status()).isEqualTo(HttpStatusCode.NotFound)
                assertThat(response.content).isEqualToIgnoringWhitespace(expectedErrorMessage)
            }
        }
    }

    @Test
    fun `POST - should create profile`() {
        testApp {
            with(createProfile("Piotr West", Role.MODEL)) {
                assertThat(response.status()).isEqualTo(HttpStatusCode.Created)
                assertThat(response.headers["Location"]).contains("/api/v1/profiles/")
                assertThat(response.content).isNotNull

                val result = Json.decodeFromString<ProfileResponse>(response.content!!)
                assertThat(result.id).isNotBlank
                assertThat(result.name).isEqualTo("Piotr West")
                assertThat(result.role).isEqualTo(Role.MODEL.name)
                assertThat(result.createdAt).isNotNull
                assertThat(result.updatedAt).isNotNull
            }
        }
    }

    @Test
    fun `POST (error) - should receive an error message when there are wrong parameters in request body`() {
        testApp {
            with(createProfileFromJson("/json/req_profile_create_wrong_params.json")) {
                val expectedErrorMessage = readFile("/json/error_profile_create_missing_fields.json")
                assertThat(response.status()).isEqualTo(HttpStatusCode.BadRequest)
                assertThat(response.content).isEqualToIgnoringWhitespace(expectedErrorMessage)
            }
        }
    }

    @Test
    fun `POST (error) - should receive an error message when there is bad role value in request body`() {
        testApp {
            with(createProfileFromJson("/json/req_profile_create_wrong_role.json")) {
                val expectedErrorMessage = readFile("/json/error_profile_create_bad_role_value.json")
                assertThat(response.status()).isEqualTo(HttpStatusCode.BadRequest)
                assertThat(response.content).isEqualToIgnoringWhitespace(expectedErrorMessage)
            }
        }
    }

    @Test
    fun `POST (error) - should receive an error message when the 'name' is too short`() {
        testApp {
            with(createProfileFromJson("/json/req_profile_create_too_short_name.json")) {
                val expectedErrorMessage = readFile("/json/error_profile_create_name_too_short.json")
                assertThat(response.status()).isEqualTo(HttpStatusCode.BadRequest)
                assertThat(response.content).isEqualToIgnoringWhitespace(expectedErrorMessage)
            }
        }
    }

    @Test
    fun `POST (error) - should receive an error message when the 'name' is too long`() {
        testApp {
            with(createProfileFromJson("/json/req_profile_create_too_long_name.json")) {
                val expectedErrorMessage = readFile("/json/error_profile_name_too_long.json")
                assertThat(response.status()).isEqualTo(HttpStatusCode.BadRequest)
                assertThat(response.content).isEqualToIgnoringWhitespace(expectedErrorMessage)
            }
        }
    }

    @Test
    fun `DELETE {id} - should delete profile`() {
        testApp {
            val createdId = createProfileAndGetId("Piotr West", Role.MODEL)
            with(handleRequest(HttpMethod.Delete, "/api/v1/profiles/$createdId"))
            { assertThat(response.status()).isEqualTo(HttpStatusCode.OK) }
        }
    }

    @Test
    fun `DELETE {id} (error) - should receive an error message when deleting profile with 'id' in wrong format`() {
        testApp {
            val wrongUuid = "wrong_format"
            with(handleRequest(HttpMethod.Delete, "/api/v1/profiles/$wrongUuid")) {
                val expectedErrorMessage = readFile("/json/error_profile_wrong_id_format.json")
                assertThat(response.status()).isEqualTo(HttpStatusCode.BadRequest)
                assertThat(response.content).isEqualToIgnoringWhitespace(expectedErrorMessage)
            }
        }
    }

    @Test
    fun `DELETE {id} (error) - should receive an error message if the profile to be deleted does not exist`() {
        testApp {
            val uuid = "ff1a116e-3e3a-4e62-ba49-6b9904c96590"
            with(handleRequest(HttpMethod.Delete, "/api/v1/profiles/$uuid")) {
                val expectedErrorMessage = readFile("/json/error_profile_not_found.json")
                assertThat(response.status()).isEqualTo(HttpStatusCode.NotFound)
                assertThat(response.content).isEqualToIgnoringWhitespace(expectedErrorMessage)
            }
        }
    }

    @Test
    fun `PATCH {id} - should update profile`() {
        testApp {
            val createdId = createProfileAndGetId("Andrzej West", Role.PHOTOGRAPHER)
            with(updateProfile(createdId, "Piotr West", Role.MODEL)) {
                assertThat(response.status()).isEqualTo(HttpStatusCode.OK)
                assertThat(response.content).isNotNull

                val result = Json.decodeFromString<ProfileResponse>(response.content!!)
                assertThat(result.id).isEqualTo(createdId)
                assertThat(result.name).isEqualTo("Piotr West")
                assertThat(result.role).isEqualTo(Role.MODEL.name)
                assertThat(result.createdAt).isNotNull
                assertThat(result.updatedAt).isNotNull
            }
        }
    }

    @Test
    fun `PATCH {id} - should update profile by role`() {
        testApp {
            val createdId = createProfileAndGetId("Piotr West", Role.MODEL)
            with(updateProfileFromJson(createdId, "/json/req_profile_update_role.json")) {
                assertThat(response.status()).isEqualTo(HttpStatusCode.OK)
                assertThat(response.content).isNotNull

                val result = Json.decodeFromString<ProfileResponse>(response.content!!)
                assertThat(result.id).isEqualTo(createdId)
                assertThat(result.name).isEqualTo("Piotr West")
                assertThat(result.role).isEqualTo(Role.DESIGNER.name)
                assertThat(result.createdAt).isNotNull
                assertThat(result.updatedAt).isNotNull
            }
        }
    }

    @Test
    fun `PATCH {id} (error) - should receive an error message when updating profile with 'id' in wrong format`() {
        testApp {
            val wrongUuid = "56f5fsdf-dsfsfd940"
            with(handleRequest(HttpMethod.Patch, "/api/v1/profiles/$wrongUuid")) {
                val expectedErrorMessage = readFile("/json/error_profile_wrong_id_format.json")
                assertThat(response.content).isEqualToIgnoringWhitespace(expectedErrorMessage)
                assertThat(response.status()).isEqualTo(HttpStatusCode.BadRequest)
            }
        }
    }

    @Test
    fun `PATCH {id} (error) - should receive an error message when the 'name' is too long`() {
        testApp {
            val createdId = createProfileAndGetId("Piotr West", Role.MODEL)
            with(updateProfileFromJson(createdId, "/json/req_profile_update_name_too_long.json")) {
                val expectedErrorMessage = readFile("/json/error_profile_name_too_long.json")
                assertThat(response.status()).isEqualTo(HttpStatusCode.BadRequest)
                assertThat(response.content).isEqualToIgnoringWhitespace(expectedErrorMessage)
            }
        }
    }
}