uniform float u_time;
uniform vec2 u_resolution;

float function(float x) {
    float y = 0.7 * sin(10.0 * (x + u_time * 0.05));
    return y;
}

float derivative(float x) {
    float dydx = 0.7 * 10.0 * cos(10.0 * (x + u_time * 0.05));
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
    // st.x = st.x * aspectRatio;
    float r = step(1.0, aspectRatio);
    st.x = st.x * mix(1.0, aspectRatio, r);
    st.y = st.y / mix(aspectRatio, 1.0, r);
    vec2 rst = vec2(-st.y, st.x);
    st = mix(rst, st, r);
    vec3 colour = vec3(0.0, 0.0, 0.0);
    
    vec3 light = vec3(0.0, 0.5, 0.0);
    vec3 glow = vec3(1.0, 1.0, 1.0);
    
    float radius = 0.7;
    float cyAxisLoc = 0.9;
    vec2 circleCentre = vec2(cyAxisLoc, 0.0);
    vec2 pointLoc = vec2(radius * cos(u_time * 0.5) + circleCentre.x, radius * sin(u_time * 0.5));
    vec2 pointOnSinLoc = vec2(0.0, radius * sin(u_time * 0.5));
    
    float xAxisMask = lineMask(vec2(-10.0, 0.0), vec2(10.0, 0.0), 0.005, 0.005, st);
    float cyAxisMask = lineMask(vec2(cyAxisLoc, 0.9), vec2(cyAxisLoc, - 0.9), 0.005, 0.005, st);
    float yAxisMask = lineMask(vec2(0.0, 0.9), vec2(0.0, - 0.9), 0.005, 0.005, st);
    
    float circle = circleOutlineMask(circleCentre, radius, 0.02, 0.02, st);
    float circleGlow = circleOutlineMask(circleCentre, radius, 0.02, 0.0, st);
    float point = circleMask(pointLoc, 0.03, 0.03, st);
    float pointGlow = circleMask(pointLoc, 0.03, 0.0, st);
    float sinWave = functionMask(0.02, 0.02, st);
    float sinWaveGlow = functionMask(0.02, 0.0, st);
    float pointOnSin = circleMask(pointOnSinLoc, 0.03, 0.03, st);
    float pointOnSinGlow = circleMask(pointOnSinLoc, 0.03, 0.0, st);
    float indicator = lineMask(pointLoc, pointOnSinLoc, 0.01, 0.01, st);
    float indicatorGlow = lineMask(pointLoc, pointOnSinLoc, 0.01, 0.0, st);
    float angleIndicator = lineMask(pointLoc, circleCentre, 0.01, 0.01, st);
    float angleIndicatorGlow = lineMask(pointLoc, circleCentre, 0.01, 0.0, st);
    
    sinWave = sinWave * (1.0 - step(0.0, st.x));
    sinWaveGlow = sinWaveGlow * (1.0 - step(0.0, st.x));
    colour = mix(colour, light, xAxisMask + cyAxisMask + yAxisMask);
    colour = mix(colour, light, circle + sinWave);
    colour = mix(colour, glow, circleGlow + sinWaveGlow);
    colour = mix(colour, light, indicator + angleIndicator);
    colour = mix(colour, glow, indicatorGlow + angleIndicatorGlow);
    colour = mix(colour, light, point + pointOnSin);
    colour = mix(colour, glow, pointGlow + pointOnSinGlow);
    gl_FragColor = vec4(colour, 1.0);
}