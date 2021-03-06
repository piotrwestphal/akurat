package com.akurat.profiles

import com.akurat.model.Role
import kotlinx.serialization.Serializable

@Serializable
data class UpdateProfileRequest(val name: String?, val role: Role?)
