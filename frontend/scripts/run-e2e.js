import { spawn } from 'child_process';
import net from 'net';

function waitPort(port, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const socket = new net.Socket();
      socket.connect(port, '127.0.0.1');
      socket.on('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error(`Excedido tempo de espera pela porta ${port}`));
        } else {
          setTimeout(check, 1000);
        }
      });
    };
    check();
  });
}

(async () => {
  let backend, frontend;
  try {
    console.log('1. Iniciando Mock Backend na porta 5000...');
    backend = spawn('node', ['mock-backend.js'], {
      stdio: 'ignore',
      shell: true
    });
    
    // Aguardar o backend iniciar
    await waitPort(5000);
    console.log('√ Mock Backend está pronto!');

    console.log('2. Iniciando Frontend Angular (ng serve) na porta 4200...');
    frontend = spawn('npx', ['ng', 'serve', '--port', '4200', '--host', '127.0.0.1'], {
      stdio: 'ignore',
      shell: true
    });

    // Aguardar o frontend iniciar
    console.log('A aguardar que o Angular compile e inicie (pode demorar alguns segundos)...');
    await waitPort(4200, 120000);
    console.log('√ Frontend Angular está pronto!');

    console.log('3. Executando testes E2E do Playwright...');
    const tests = spawn('npx', ['playwright', 'test'], {
      stdio: 'inherit',
      shell: true
    });

    tests.on('exit', (code) => {
      console.log(`\nTestes finalizados com código de saída: ${code}`);
      cleanup(code);
    });

  } catch (err) {
    console.error('Erro durante a execução do E2E:', err);
    cleanup(1);
  }

  function cleanup(exitCode) {
    console.log('4. Limpando processos em execução...');
    if (backend) {
      try {
        process.kill(-backend.pid); // matar grupo de processos se suportado
      } catch {
        backend.kill();
      }
    }
    if (frontend) {
      try {
        process.kill(-frontend.pid);
      } catch {
        frontend.kill();
      }
    }
    console.log('√ Limpeza concluída!');
    process.exit(exitCode);
  }
})();
