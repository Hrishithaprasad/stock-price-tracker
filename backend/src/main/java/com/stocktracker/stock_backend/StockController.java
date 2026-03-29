package com.stocktracker.stock_backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/stock")
@CrossOrigin(origins = "http://localhost:3000")
public class StockController {

    @Value("${twelvedata.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/{symbol}")
    public Object getStock(@PathVariable String symbol) {
        String url = "https://api.twelvedata.com/quote?symbol=" 
                     + symbol + "&apikey=" + apiKey;
        return restTemplate.getForObject(url, Object.class);
    }

    @GetMapping("/price/{symbol}")
    public Object getPrice(@PathVariable String symbol) {
        String url = "https://api.twelvedata.com/price?symbol=" 
                     + symbol + "&apikey=" + apiKey;
        return restTemplate.getForObject(url, Object.class);
    }
}