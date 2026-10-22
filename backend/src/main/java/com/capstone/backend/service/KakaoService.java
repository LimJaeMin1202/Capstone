package com.capstone.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class KakaoService {

    private static final String TOKEN_URI = "https://kauth.kakao.com/oauth/token";
    private static final String USER_URI = "https://kapi.kakao.com/v2/user/me";

    private final String restApiKey;
    private final String clientSecret;
    private final RestClient restClient;

    public KakaoService(
            @Value("${kakao.rest-api-key}") String restApiKey,
            @Value("${kakao.client-secret:}") String clientSecret
    ) {
        this.restApiKey = restApiKey;
        this.clientSecret = clientSecret;
        this.restClient = RestClient.create();
    }

    // 1단계: 인가코드 → 액세스 토큰
    public String getAccessToken(String code, String redirectUri) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("client_id", restApiKey);
        if (clientSecret != null && !clientSecret.isBlank()) {
            body.add("client_secret", clientSecret);
        }
        body.add("redirect_uri", redirectUri);
        body.add("code", code);

        Map<String, Object> response = restClient.post()
                .uri(TOKEN_URI)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(body)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});

        if (response == null || !response.containsKey("access_token")) {
            throw new IllegalArgumentException("카카오 토큰 발급 실패");
        }
        return (String) response.get("access_token");
    }

    // 2단계: 액세스 토큰 → 사용자 정보
    @SuppressWarnings("unchecked")
    public KakaoUserInfo getUserInfo(String accessToken) {
        Map<String, Object> response = restClient.get()
                .uri(USER_URI)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});

        if (response == null || !response.containsKey("id")) {
            throw new IllegalArgumentException("카카오 사용자 정보 조회 실패");
        }

        Long kakaoId = ((Number) response.get("id")).longValue();
        String nickname = "카카오회원";

        Object accountObj = response.get("kakao_account");
        if (accountObj instanceof Map<?, ?> account) {
            Object profileObj = account.get("profile");
            if (profileObj instanceof Map<?, ?> profile) {
                Object nick = profile.get("nickname");
                if (nick instanceof String s && !s.isBlank()) {
                    nickname = s;
                }
            }
        }
        return new KakaoUserInfo(kakaoId, nickname);
    }

    public record KakaoUserInfo(Long kakaoId, String nickname) {}
}
