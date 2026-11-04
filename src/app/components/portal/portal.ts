import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ItemService } from '../../services/item/item-service';
import { FuncionarioService } from '../../services/funcionario/funcionario-service';
import { AtendimentoApi, PedidoService } from '../../services/pedido/pedido-service';
import { PessoaService } from '../../services/pessoa/pessoa-service';
import { AdminAuth } from '../../services/admin-auth/admin-auth';

const LIMITE_ESTOQUE_BAIXO = 3;

/** Indicadores do painel. Cada valor é null enquanto carrega ou quando a API falha. */
interface Indicadores {
  clientes: number | null;
  funcionarios: number | null;
  produtos: number | null;
  servicos: number | null;
  estoqueBaixo: number | null;
  pendentes: number | null;
  concluidos: number | null;
  faturamento: number | null;
  pedidosHoje: number | null;
}

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-portal',
  styleUrl: './portal.css',
  templateUrl: './portal.html',
})
export class Portal {
  private readonly auth = inject(AdminAuth);
  private readonly router = inject(Router);
  private readonly pessoaService = inject(PessoaService);
  private readonly funcionarioService = inject(FuncionarioService);
  private readonly itemService = inject(ItemService);
  private readonly pedidoService = inject(PedidoService);

  readonly carregando = signal(true);
  readonly falhas = signal<string[]>([]);
  readonly indicadores = signal<Indicadores>({
    clientes: null, funcionarios: null, produtos: null, servicos: null, estoqueBaixo: null,
    pendentes: null, concluidos: null, faturamento: null, pedidosHoje: null
  });
  readonly pedidosRecentes = signal<AtendimentoApi[]>([]);
  readonly hojeIso = this.dataHoje();

  readonly temFalhas = computed(() => this.falhas().length > 0);

  constructor() {
    this.carregarIndicadores();
  }

  sair(): void {
    this.auth.sair();
    this.router.navigate(['/home']);
  }

  total(valor: number | null): string {
    return valor === null ? '—' : String(valor);
  }

  pedidoTotal(pedido: AtendimentoApi): number {
    return this.pedidoService.total(pedido);
  }

  rotuloStatus(pedido: AtendimentoApi): string {
    return this.pedidoService.rotuloStatus(pedido.statusAtendimento);
  }

  private carregarIndicadores(): void {
    this.carregando.set(true);
    const falhas: string[] = [];
    let emAndamento = 5;

    const finalizar = (): void => {
      emAndamento--;
      if (emAndamento === 0) {
        this.falhas.set([...new Set(falhas)]);
        this.carregando.set(false);
      }
    };

    // Uma única assinatura por fonte: sucesso aplica o valor; erro registra a falha e conta como concluído.
    const ler = <T>(origem: Observable<T>, nome: string, aplicar: (valor: T) => void): void => {
      origem.subscribe({
        next: aplicar,
        error: () => { falhas.push(nome); finalizar(); },
        complete: finalizar
      });
    };

    ler(this.pessoaService.listarPessoas(), 'clientes',
      lista => this.atualizar({ clientes: lista.length }));

    ler(this.funcionarioService.listar(), 'funcionários',
      lista => this.atualizar({ funcionarios: lista.length }));

    ler(this.itemService.listar('P'), 'produtos', lista => {
      const ativos = lista.filter(p => p.ativo);
      const baixo = ativos.filter(p => p.estoque !== undefined && p.estoque <= LIMITE_ESTOQUE_BAIXO).length;
      this.atualizar({ produtos: ativos.length, estoqueBaixo: baixo });
    });

    ler(this.itemService.listar('S'), 'serviços',
      lista => this.atualizar({ servicos: lista.filter(s => s.ativo).length }));

    ler(this.pedidoService.listar(), 'pedidos', lista => {
      const pedidos = lista ?? [];
      const status = (p: AtendimentoApi) => String(p.statusAtendimento ?? '').toUpperCase();
      this.pedidosRecentes.set(
        [...pedidos].sort((a, b) => Number(b.idAtendimento ?? 0) - Number(a.idAtendimento ?? 0)).slice(0, 5));
      this.atualizar({
        pendentes: pedidos.filter(p => status(p) === 'P').length,
        concluidos: pedidos.filter(p => status(p) === 'F').length,
        faturamento: pedidos
          .filter(p => status(p) === 'F')
          .reduce((soma, p) => soma + this.pedidoService.total(p), 0),
        pedidosHoje: pedidos.filter(p => (p.dataAtendimento ?? '').substring(0, 10) === this.hojeIso).length
      });
    });
  }

  private atualizar(parcial: Partial<Indicadores>): void {
    this.indicadores.update(atual => ({ ...atual, ...parcial }));
  }

  private dataHoje(): string {
    const agora = new Date();
    return new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
}
