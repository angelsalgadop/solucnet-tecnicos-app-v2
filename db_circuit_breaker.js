// Circuit Breaker para conexiones de base de datos
// Evita reintentos constantes a BDs que están caídas

class CircuitBreaker {
    constructor(host, failureThreshold = 5, resetTimeout = 300000) { // 5 minutos por defecto
        this.host = host;
        this.failureThreshold = failureThreshold;
        this.resetTimeout = resetTimeout;
        this.failures = 0;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.nextAttempt = Date.now();
        this.lastFailureTime = null;
    }

    async execute(connectionFunction, timeout = 3000) {
        // Si el circuito está abierto, verificar si es tiempo de reintentar
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                const waitTime = Math.round((this.nextAttempt - Date.now()) / 1000);
                throw new Error(`Circuit breaker OPEN para ${this.host}. Reintentará en ${waitTime}s`);
            }
            // Pasar a medio abierto para probar la conexión
            this.state = 'HALF_OPEN';
        }

        try {
            // Crear promesa con timeout
            const result = await Promise.race([
                connectionFunction(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Connection timeout')), timeout)
                )
            ]);

            // Éxito - resetear el circuito
            this.onSuccess();
            return result;

        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    onSuccess() {
        this.failures = 0;
        this.state = 'CLOSED';
        console.log(`✅ [CIRCUIT-BREAKER] ${this.host} - Circuito CERRADO (funcionando)`);
    }

    onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();

        if (this.failures >= this.failureThreshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.resetTimeout;
            const waitMinutes = Math.round(this.resetTimeout / 60000);
            console.log(`🚫 [CIRCUIT-BREAKER] ${this.host} - Circuito ABIERTO (deshabilitado por ${waitMinutes} min)`);
        } else {
            console.log(`⚠️ [CIRCUIT-BREAKER] ${this.host} - Fallo ${this.failures}/${this.failureThreshold}`);
        }
    }

    isOpen() {
        return this.state === 'OPEN' && Date.now() < this.nextAttempt;
    }

    getStatus() {
        return {
            host: this.host,
            state: this.state,
            failures: this.failures,
            threshold: this.failureThreshold,
            nextAttempt: this.state === 'OPEN' ? new Date(this.nextAttempt).toISOString() : null,
            lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null
        };
    }
}

// Singleton para gestionar todos los circuit breakers
class CircuitBreakerManager {
    constructor() {
        this.breakers = new Map();
        this.stats = {
            totalAttempts: 0,
            blockedAttempts: 0,
            successfulConnections: 0,
            failedConnections: 0
        };
    }

    getBreaker(host, failureThreshold = 5, resetTimeout = 300000) {
        if (!this.breakers.has(host)) {
            this.breakers.set(host, new CircuitBreaker(host, failureThreshold, resetTimeout));
        }
        return this.breakers.get(host);
    }

    async executeWithBreaker(host, connectionFunction, timeout = 3000) {
        this.stats.totalAttempts++;
        const breaker = this.getBreaker(host);

        if (breaker.isOpen()) {
            this.stats.blockedAttempts++;
            console.log(`🚫 [CIRCUIT-BREAKER] Conexión bloqueada a ${host} (circuito abierto)`);
            throw new Error(`Circuit breaker bloqueó conexión a ${host}`);
        }

        try {
            const result = await breaker.execute(connectionFunction, timeout);
            this.stats.successfulConnections++;
            return result;
        } catch (error) {
            this.stats.failedConnections++;
            throw error;
        }
    }

    getAllStatus() {
        const statuses = [];
        for (const [host, breaker] of this.breakers) {
            statuses.push(breaker.getStatus());
        }
        return {
            breakers: statuses,
            stats: this.stats
        };
    }

    resetStats() {
        this.stats = {
            totalAttempts: 0,
            blockedAttempts: 0,
            successfulConnections: 0,
            failedConnections: 0
        };
    }

    resetBreaker(host) {
        const breaker = this.breakers.get(host);
        if (breaker) {
            breaker.failures = 0;
            breaker.state = 'CLOSED';
            console.log(`🔄 [CIRCUIT-BREAKER] ${host} reiniciado manualmente`);
            return true;
        }
        return false;
    }
}

// Exportar singleton
const manager = new CircuitBreakerManager();

module.exports = {
    CircuitBreaker,
    CircuitBreakerManager: manager,
    executeWithBreaker: (host, fn, timeout) => manager.executeWithBreaker(host, fn, timeout),
    getStatus: () => manager.getAllStatus(),
    resetBreaker: (host) => manager.resetBreaker(host),
    resetStats: () => manager.resetStats()
};
