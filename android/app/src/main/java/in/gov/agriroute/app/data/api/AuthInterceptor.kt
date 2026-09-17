package `in`.gov.agriroute.app.data.api

import `in`.gov.agriroute.app.data.repository.AgriRouteRepository
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val session = AgriRouteRepository.currentUserSession.value
        
        val requestBuilder = originalRequest.newBuilder()
            .header("Accept", "application/json")
            .header("Content-Type", "application/json")

        if (session != null && session.token.isNotBlank()) {
            requestBuilder.header("Authorization", "Bearer ${session.token}")
            requestBuilder.header("Cookie", "userRole=${session.role}")
        }

        return chain.proceed(requestBuilder.build())
    }
}
