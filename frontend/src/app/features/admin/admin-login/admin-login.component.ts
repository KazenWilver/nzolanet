import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { gsap } from 'gsap';
import { environment } from '../../../../environments/environment';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gradientOrbA') gradientOrbA?: ElementRef<HTMLDivElement>;
  @ViewChild('gradientOrbB') gradientOrbB?: ElementRef<HTMLDivElement>;
  @ViewChild('gradientOrbC') gradientOrbC?: ElementRef<HTMLDivElement>;
  @ViewChild('registerFields') registerFields?: ElementRef<HTMLDivElement>;
  @ViewChild('authFormRoot') authFormRoot?: ElementRef<HTMLFormElement>;
  @ViewChild('titleRef') titleRef?: ElementRef<HTMLHeadingElement>;
  @ViewChild('descriptionRef') descriptionRef?: ElementRef<HTMLParagraphElement>;

  modo: 'login' | 'register' = 'login';
  nome = '';
  nomeUtilizador = '';
  email = '';
  senha = '';
  confirmarSenha = '';
  codigoConvite = '';
  carregando = false;
  mensagemErro = '';
  mensagemSucesso = '';
  mostrarSenha = false;
  mostrarConfirmarSenha = false;
  private orbTweens: gsap.core.Tween[] = [];
  private hueTween?: gsap.core.Tween;

  constructor(
    private http: HttpClient,
    private router: Router,
    readonly themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Se já houver token admin, redireciona para o painel
    if (localStorage.getItem('admin_token')) {
      this.router.navigate(['/admin-portal-9f3b1c']);
    }
  }

  ngAfterViewInit(): void {
    this.iniciarAnimacaoGradiente();
  }

  ngOnDestroy(): void {
    this.pararAnimacaoGradiente();
  }

  submeter(): void {
    if (this.modo === 'register') {
      this.registarAdministrador();
      return;
    }

    this.entrar();
  }

  alternarModo(modo: 'login' | 'register'): void {
    if (this.modo === modo) {
      return;
    }

    const modoAnterior = this.modo;
    this.modo = modo;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    requestAnimationFrame(() => {
      this.animarTransicaoModo(modoAnterior, modo);
    });
  }

  entrar(): void {
    if (!this.email || !this.senha) {
      this.mensagemErro = 'Por favor, preencha todos os campos.';
      return;
    }

    this.carregando = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    this.http.post<{ token: string }>(`${environment.apiUrl}/admin/login`, {
      email: this.email,
      password: this.senha
    }).subscribe({
      next: (resposta) => {
        localStorage.setItem('admin_token', resposta.token);
        this.router.navigate(['/admin-portal-9f3b1c']);
      },
      error: (err) => {
        this.carregando = false;
        this.mensagemErro = err.error?.message || 'Erro ao fazer login. Verifique as credenciais.';
      }
    });
  }

  registarAdministrador(): void {
    if (!this.nome || !this.nomeUtilizador || !this.email || !this.senha) {
      this.mensagemErro = 'Preencha todos os campos obrigatórios.';
      return;
    }

    if (this.senha.length < 6) {
      this.mensagemErro = 'A senha deve ter pelo menos 6 caracteres.';
      return;
    }

    if (this.senha !== this.confirmarSenha) {
      this.mensagemErro = 'As senhas não coincidem.';
      return;
    }

    this.carregando = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    this.http.post<{ token: string }>(`${environment.apiUrl}/admin/register`, {
      displayName: this.nome,
      username: this.nomeUtilizador,
      email: this.email,
      password: this.senha,
      inviteCode: this.codigoConvite?.trim() || null
    }).subscribe({
      next: resposta => {
        localStorage.setItem('admin_token', resposta.token);
        this.mensagemSucesso = 'Administrador registado com sucesso.';
        this.router.navigate(['/admin-portal-9f3b1c']);
      },
      error: err => {
        this.carregando = false;
        this.mensagemErro = err.error?.message || 'Erro ao registar administrador.';
      }
    });
  }

  alternarMostrarSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  alternarMostrarConfirmarSenha(): void {
    this.mostrarConfirmarSenha = !this.mostrarConfirmarSenha;
  }

  alternarTema(): void {
    this.themeService.toggleTheme();
    this.iniciarAnimacaoGradiente();
  }

  voltarParaApp(): void {
    this.router.navigate(['/feed']);
  }

  private iniciarAnimacaoGradiente(): void {
    this.pararAnimacaoGradiente();

    const orbA = this.gradientOrbA?.nativeElement;
    const orbB = this.gradientOrbB?.nativeElement;
    const orbC = this.gradientOrbC?.nativeElement;

    if (!orbA || !orbB || !orbC) {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set([orbA, orbB, orbC], { x: 0, y: 0, rotation: 0 });
      return;
    }

    const isDark = this.themeService.isDarkMode();
    const timeScale = isDark ? 1.15 : 1;

    this.orbTweens.push(
      gsap.to(orbA, {
        x: 64,
        y: -36,
        rotation: 14,
        duration: 8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      }),
      gsap.to(orbB, {
        x: -52,
        y: 40,
        rotation: -20,
        duration: 10,
        ease: 'power2.inOut',
        repeat: -1,
        yoyo: true
      }),
      gsap.to(orbC, {
        x: 34,
        y: 26,
        rotation: 18,
        duration: 12,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      })
    );

    this.orbTweens.forEach(tween => tween.timeScale(timeScale));

    this.hueTween = gsap.to([orbA, orbB], {
      filter: isDark ? 'hue-rotate(24deg) saturate(1.25)' : 'hue-rotate(16deg) saturate(1.15)',
      duration: isDark ? 6 : 8,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true
    });
  }

  private pararAnimacaoGradiente(): void {
    this.orbTweens.forEach(tween => tween.kill());
    this.orbTweens = [];
    this.hueTween?.kill();
    this.hueTween = undefined;
  }

  private animarTransicaoModo(modoAnterior: 'login' | 'register', novoModo: 'login' | 'register'): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.animarCabecalhoModo();
    this.animarCamposComuns();
    this.animarBlocoRegisto(modoAnterior, novoModo);
  }

  private animarCabecalhoModo(): void {
    const titulo = this.titleRef?.nativeElement;
    const descricao = this.descriptionRef?.nativeElement;
    if (!titulo || !descricao) {
      return;
    }

    gsap.fromTo(
      [titulo, descricao],
      { opacity: 0.2, y: 10, filter: 'blur(3px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.52, ease: 'elastic.out(1, 0.72)', stagger: 0.08, overwrite: 'auto' }
    );
  }

  private animarCamposComuns(): void {
    const formulario = this.authFormRoot?.nativeElement;
    if (!formulario) {
      return;
    }

    const camposPartilhados = Array.from(formulario.querySelectorAll('.admin-auth__field--shared'));
    if (camposPartilhados.length === 0) {
      return;
    }

    gsap.fromTo(
      camposPartilhados,
      { opacity: 0.45, y: 8 },
      { opacity: 1, y: 0, duration: 0.46, ease: 'elastic.out(1, 0.78)', stagger: 0.05, overwrite: 'auto' }
    );
  }

  private animarBlocoRegisto(modoAnterior: 'login' | 'register', novoModo: 'login' | 'register'): void {
    const blocoRegisto = this.registerFields?.nativeElement;
    if (!blocoRegisto) {
      return;
    }

    gsap.killTweensOf(blocoRegisto);

    if (novoModo === 'register') {
      gsap.fromTo(
        blocoRegisto,
        { height: 0, opacity: 0, y: -14 },
        { height: 'auto', opacity: 1, y: 0, duration: 0.56, ease: 'elastic.out(1, 0.76)', overwrite: 'auto' }
      );

      const camposRegisto = Array.from(blocoRegisto.querySelectorAll('.admin-auth__field--register'));
      if (camposRegisto.length > 0)
      {
        gsap.fromTo(
          camposRegisto,
          { opacity: 0, y: 16, scale: 0.985 },
          { opacity: 1, y: 0, scale: 1, duration: 0.54, ease: 'elastic.out(1, 0.72)', stagger: 0.06, delay: 0.08, overwrite: 'auto' }
        );
      }

      return;
    }

    if (modoAnterior === 'register') {
      const camposRegisto = Array.from(blocoRegisto.querySelectorAll('.admin-auth__field--register'));
      if (camposRegisto.length > 0)
      {
        gsap.to(camposRegisto, {
          opacity: 0,
          y: -8,
          duration: 0.2,
          ease: 'power2.in',
          stagger: 0.03,
          overwrite: 'auto'
        });
      }

      gsap.fromTo(
        blocoRegisto,
        { height: blocoRegisto.scrollHeight, opacity: 1, y: 0 },
        { height: 0, opacity: 0, y: -10, duration: 0.38, ease: 'back.inOut(1.25)', overwrite: 'auto' }
      );
    }
  }
}
