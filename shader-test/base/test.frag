uniform float u_time;
uniform vec2 u_resolution;

vec2 paramFunction(float theta, float phaseOffset) {
    float x = sin(theta + phaseOffset);
    float y = sin(2.0 * theta);
    return vec2(x, y);
}

vec2 paramDerivative(float theta, float phaseOffset) {
    float dxdt = cos(theta + phaseOffset);
    float dydt = 2.0 * cos(2.0 * theta);
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
    float theta = asin(st.x) - phaseOffset;
    float mask = paramBranchMask(thickness, blurRadius, theta, phaseOffset, st);
    theta = 3.14159265358 - asin(st.x) - phaseOffset;
    mask = mask + paramBranchMask(thickness, blurRadius, theta, phaseOffset, st);
    return mask;
}

float function(float x) {
    float y = sin(2.0 * x) + 1.0 / 3.0 * sin(6.0 * x);
    return y;
}

float derivative(float x) {
    float dydx = 2.0 * cos(2.0 * x) + 2.0 * cos(6.0 * x);
    return dydx;
}

float functionMask(float thickness, float blurRadius, vec2 st) {
    float y = function(st.x);
    vec2 target = vec2(st.x, y);
    float dydx = derivative(st.x);
    float angle = atan(dydx);
    vec2 normal = vec2(-sin(angle), cos(angle));
    float thicknessBy2 = thickness / 2.0;
    float distanceToWave = dot(st - target, normal);
    return smoothstep(-blurRadius - thicknessBy2, - thicknessBy2, distanceToWave) -
    smoothstep(thicknessBy2, blurRadius + thicknessBy2, distanceToWave);
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

float circleOutlineMask(vec2 centre, float r, float thickness, float blurRadius, vec2 st) {
    vec2 diff = st - centre;
    float length2 = dot(diff, diff);
    float solidLeft2 = pow(r - thickness / 2.0, 2.0);
    float solidRight2 = pow(r + thickness / 2.0, 2.0);
    float blurLeft2 = pow(r - thickness / 2.0 - blurRadius, 2.0);
    float blurRight2 = pow(r + thickness / 2.0 + blurRadius, 2.0);
    return smoothstep(blurLeft2, solidLeft2, length2) - smoothstep(solidRight2, blurRight2, length2);
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
    // vec2 rst = vec2(-st.y, st.x);
    // st = mix(rst, st, r);
    
    vec2 centre = vec2(0.0, 0.0);
    float radius = 0.5;
    vec3 background = vec3(0.0, 0.0, 0.0);
    vec3 circleColour = vec3(1.0, 0.5, 0.0);
    float mask = circleOutlineMask(centre, radius, 0.005, 0.02, st);
    float borderMask = circleOutlineMask(centre, radius, 0.005, 0.0, st);
    vec3 colour = mix(background, circleColour, mask);
    colour = mix(colour, vec3(1.0, 1.0, 1.0), borderMask);
    vec2 p1 = vec2(-0.8, 0.0);
    vec2 p2 = vec2(0.8, 0.0);
    float line = lineMask(p1, p2, 0.05, 0.05, st);
    float light = lineMask(p1, p2, 0.05, 0.0, st);
    // vec2 pointCentre = paramFunction(u_time * 0.5, 0.0);
    vec2 pointCentre = vec2(radius * cos(u_time * 0.5), radius * sin(u_time * 0.5));
    float circleBlur = circleMask(pointCentre, 0.02, 0.02, st);
    float clrcleGlow = circleMask(pointCentre, 0.02, 0.0, st);
    float lissajous = paramMask(0.02, 0.02, u_time * 0.1, st);
    float lissajousGlow = paramMask(0.02, 0.0, u_time * 0.1, st);
    float square = functionMask(0.02, 0.03, vec2(st.x + u_time * 0.5, st.y));
    float squareGlow = functionMask(0.02, 0.0, vec2(st.x + u_time * 0.5, st.y));
    colour = mix(colour, circleColour, line);
    colour = mix(colour, vec3(1.0, 1.0, 1.0), light);
    colour = mix(colour, vec3(0.5, 0.0, 0.5), lissajous);
    colour = mix(colour, vec3(1.0, 1.0, 1.0), lissajousGlow);
    colour = mix(colour, circleColour, circleBlur);
    colour = mix(colour, vec3(1.0, 1.0, 1.0), clrcleGlow);
    colour = mix(colour, circleColour, square);
    colour = mix(colour, vec3(1.0, 1.0, 1.0), squareGlow);
    gl_FragColor = vec4(colour, 1.0);
}