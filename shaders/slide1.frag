uniform float u_time;
uniform vec2 u_resolution;

#define PI 3.14159265358

vec2 paramFunction(float theta, float phaseOffset) {
    float x = sin(4.0 * theta + phaseOffset);
    float y = sin(5.0 * theta);
    return vec2(x, y);
}

float circleMask(vec2 centre, float r, float blurRadius, vec2 st) {
    vec2 difference = st - centre;
    float distance2 = dot(difference, difference);
    float solid2 = pow(r, 2.0);
    float blur2 = pow(r + blurRadius, 2.0);
    return 1.0 - smoothstep(solid2, blur2, distance2);
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy * 2.0 - vec2(1.0, 1.0);
    float aspectRatio = u_resolution.x / u_resolution.y;
    float r = step(1.0, aspectRatio);
    st.x = st.x * mix(1.0, aspectRatio, r);
    st.y = st.y / mix(aspectRatio, 1.0, r);
    vec3 colour = vec3(0.0, 0.0, 0.0);
    
    vec3 skyColour = vec3(0.0, 0.0, 0.3);
    vec3 groundColour = vec3(0.0, 0.0, 0.5);
    vec3 fireflyColour = vec3(1.0, 1.0, 0.0);
    vec3 glowColour = vec3(1.0, 1.0, 1.0);
    colour = mix(groundColour, skyColour, st.y);
    
    float lightMask = 0.0;
    float glowMask = 0.0;
    for(int i = 0; i < 50; i ++ ) {
        float phase = PI / 25.0 * float(i) + u_time * 0.01;
        vec2 location = paramFunction(phase, 0.0);
        lightMask = lightMask + circleMask(location, 0.01, 0.02, st);
        glowMask = glowMask + circleMask(location, 0.01, 0.0, st);
    }
    lightMask = clamp(lightMask, 0.0, 1.0);
    glowMask = clamp(glowMask, 0.0, 1.0);
    colour = mix(colour, fireflyColour, lightMask);
    colour = mix(colour, glowColour, glowMask);
    
    gl_FragColor = vec4(colour, 1.0);
}