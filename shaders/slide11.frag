uniform float u_time;
uniform vec2 u_resolution;

vec2 paramFunction(float theta, float phaseOffset) {
    float x = 1.5 * sin(theta + phaseOffset);
    float y = (1.0 + 0.5 * cos(u_time * 0.5)) * sin(theta);
    return vec2(x, y);
}

vec2 paramDerivative(float theta, float phaseOffset) {
    float dxdt = 1.5 * cos(theta + phaseOffset);
    float dydt = (1.0 + 0.5 * cos(u_time * 0.5)) * cos(theta);
    return vec2(dxdt, dydt);
}

float paramBranchMask(float thickness, float blurRadius, float theta, float phaseOffset, vec2 st) {
    vec2 derivative = paramDerivative(theta, phaseOffset);
    float dydx = derivative.y / derivative.x;
    float angle = atan(dydx);
    vec2 normal = vec2(-sin(angle), cos(angle));
    float normalIsInvalid = step(-0.15, derivative.x) - step(0.15, derivative.x);
    normal = mix(normal, vec2(0, 1), normalIsInvalid);
    vec2 target = paramFunction(theta, phaseOffset);
    float thicknessBy2 = thickness / 2.0;
    float distanceToWave = dot(st - target, normal);
    return smoothstep(-blurRadius - thicknessBy2, - thicknessBy2, distanceToWave) -
    smoothstep(thicknessBy2, blurRadius + thicknessBy2, distanceToWave);
}

float paramMask(float thickness, float blurRadius, float phaseOffset, vec2 st) {
    float theta = asin(st.x / 1.5) - phaseOffset;
    float mask = paramBranchMask(thickness, blurRadius, theta, phaseOffset, st);
    theta = 3.14159265358 - asin(st.x / 1.5) - phaseOffset;
    mask = mask + paramBranchMask(thickness, blurRadius, theta, phaseOffset, st);
    return mask;
}

float lineMask(vec2 start, vec2 end, float thickness, float blurRadius, vec2 st) {
    float lengthOfLine = length(end - start);
    vec2 tangentUnit = (end - start) / lengthOfLine;
    vec2 normalUnit = vec2(-tangentUnit.y, tangentUnit.x);
    float tangentLength = dot(st - start, tangentUnit);
    float normalLength = dot(st - start, normalUnit);
    float thicknessBy2 = thickness / 2.0;
    float tangentMask = smoothstep(-blurRadius, 0.0, tangentLength) -
    smoothstep(lengthOfLine, lengthOfLine + blurRadius, tangentLength);
    float normalMask = smoothstep(-thicknessBy2 - blurRadius, - thicknessBy2, normalLength) -
    smoothstep(thicknessBy2, thicknessBy2 + blurRadius, normalLength);
    return tangentMask * normalMask;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy * 2.0 - vec2(1.0, 1.0);
    float aspectRatio = u_resolution.x / u_resolution.y;
    float r = step(1.0, aspectRatio);
    st.x = st.x * mix(1.0, aspectRatio, r) * 1.5;
    st.y = st.y / mix(aspectRatio, 1.0, r) * 1.5;
    vec3 colour = vec3(0.0, 0.0, 0.0);
    
    vec3 light = vec3(0.0, 0.5, 0.0);
    vec3 glow = vec3(1.0, 1.0, 1.0);
    
    float xAxisLight = lineMask(vec2(-10.0, 0.0), vec2(10.0, 0.0), 0.005, 0.01, st);
    float yAxisLight = lineMask(vec2(0.0, - 10.0), vec2(0.0, 10.0), 0.005, 0.01, st);
    float ellipseLight = paramMask(0.05, 0.05, 3.14159265358 / 2.0, st);
    float ellipseGlow = paramMask(0.05, 0.0, 3.14159265358 / 2.0, st);
    colour = mix(colour, light, xAxisLight);
    colour = mix(colour, light, yAxisLight);
    colour = mix(colour, light, ellipseLight);
    colour = mix(colour, glow, ellipseGlow);
    gl_FragColor = vec4(colour, 1.0);
}
