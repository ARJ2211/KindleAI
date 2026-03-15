import { parentPort, workerData } from "worker_threads";

console.log(`[worker:test] Executing with data:`, workerData);
console.log(`[worker:test] Doing some heavy work...`);

setTimeout(() => {
    console.log(`[test.worker] Done!`);
    parentPort.postMessage({
        success: true,
        result: "Worker executed successfully",
    });
}, 2000);
