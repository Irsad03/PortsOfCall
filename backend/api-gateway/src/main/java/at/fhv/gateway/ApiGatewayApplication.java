package at.fhv.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.config.GatewayClassPathWarningAutoConfiguration;
import org.springframework.cloud.autoconfigure.LifecycleMvcEndpointAutoConfiguration;

@SpringBootApplication(exclude = {
        GatewayClassPathWarningAutoConfiguration.class,
        LifecycleMvcEndpointAutoConfiguration.class
})
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}