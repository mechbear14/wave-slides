uniform float u_time;
uniform vec2 u_resolution;

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
    float circleLight = circleOutlineMask(vec2(0.0, 0.0), 1.0, 0.03, 0.03, st);
    float circleGlow = circleOutlineMask(vec2(0.0, 0.0), 1.0, 0.03, 0.0, st);
    float pointLight = circleMask(vec2(cos(u_time * 0.5), sin(u_time * 0.5)), 0.05, 0.05, st);
    float pointGlow = circleMask(vec2(cos(u_time * 0.5), sin(u_time * 0.5)), 0.05, 0.0, st);
    colour = mix(colour, light, xAxisLight);
    colour = mix(colour, light, yAxisLight);
    colour = mix(colour, light, circleLight);
    colour = mix(colour, glow, circleGlow);
    colour = mix(colour, light, pointLight);
    colour = mix(colour, glow, pointGlow);
    gl_FragColor = vec4(colour, 1.0);
}