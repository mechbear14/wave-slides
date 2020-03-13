uniform float u_time;
uniform vec2 u_resolution;

#define PI 3.14159265358

vec2 paramFunction(float theta, float phaseOffset) {
    float x = sin(4.0 * theta + phaseOffset);
    float y = sin(5.0 * theta);
    return vec2(x, y);
}

vec2 paramDerivative(float theta, float phaseOffset) {
    float dxdt = 4.0 * cos(4.0 * theta + phaseOffset);
    float dydt = 5.0 * cos(5.0 * theta);
    return vec2(dxdt, dydt);
}

float paramBranchMask(float thickness, float blurRadius, float theta, float phaseOffset, vec2 st) {
    vec2 derivative = paramDerivative(theta, phaseOffset);
    float dydx = derivative.y / derivative.x;
    float angle = atan(dydx);
    vec2 normal = vec2(-sin(angle), cos(angle));
    vec2 target = paramFunction(theta, phaseOffset);
    float thicknessBy2 = thickness / 2.0;
    float distanceToWave = dot(st - target, normal);
    return smoothstep(-blurRadius - thicknessBy2, - thicknessBy2, distanceToWave) -
    smoothstep(thicknessBy2, blurRadius + thicknessBy2, distanceToWave);
}

float paramMask(float thickness, float blurRadius, float phaseOffset, vec2 st) {
    float theta = 0.0;
    float mask = 0.0;
    for(int i = 0; i < 4; i ++ ) {
        theta = (asin(st.x) - phaseOffset + PI * float(2 * i)) / 4.0;
        mask = mask + paramBranchMask(thickness, blurRadius, theta, phaseOffset, st);
        theta = (3.14159265358 - asin(st.x) - phaseOffset + PI * float(2 * i)) / 4.0;
        mask = mask + paramBranchMask(thickness, blurRadius, theta, phaseOffset, st);
    }
    return clamp(mask, 0.0, 1.0);
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
    vec3 pathColour = vec3(0.0, 0.0, 0.0);
    colour = mix(groundColour, skyColour, st.y);
    
    float pathMask = clamp(0.2 - u_time * 0.005, 0.0, 1.0) * paramMask(0.02, 0.0, 0.0, st);
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
    colour = mix(colour, pathColour, pathMask);
    colour = mix(colour, fireflyColour, lightMask);
    colour = mix(colour, glowColour, glowMask);
    
    gl_FragColor = vec4(colour, 1.0);
}