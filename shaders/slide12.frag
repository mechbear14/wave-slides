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
    float normalIsInvalid = step(-0.2, derivative.x) - step(0.2, derivative.x);
    normal = mix(normal, vec2(0, 1), normalIsInvalid);
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

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy * 2.0 - vec2(1.0, 1.0);
    float aspectRatio = u_resolution.x / u_resolution.y;
    float r = step(1.0, aspectRatio);
    st.x = st.x * mix(1.0, aspectRatio, r);
    st.y = st.y / mix(aspectRatio, 1.0, r);
    vec3 colour = vec3(0.0, 0.0, 0.0);
    
    vec3 light = vec3(0.0, 0.5, 0.0);
    vec3 glow = vec3(1.0, 1.0, 1.0);
    
    float lissajous = paramMask(0.02, 0.02, u_time * 0.1, st);
    float lissajousGlow = paramMask(0.02, 0.0, u_time * 0.1, st);
    colour = mix(colour, light, lissajous);
    colour = mix(colour, glow, lissajousGlow);
    
    gl_FragColor = vec4(colour, 1.0);
}