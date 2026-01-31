import React, { useState, useEffect, useRef } from "react";
import { ESTILOS, CORES_TURMAS } from "./styles";
import CadastroAulas from "./CadastroAulas";
import GestaoProfessores from "./GestaoProfessores";
import Relatorio from "./Relatorio";

// Helper para meses por extenso
const MESES_EXTENSO = {
  "01": "Janeiro",
  "02": "Fevereiro",
  "03": "Março",
  "04": "Abril",
  "05": "Maio",
  "06": "Junho",
  "07": "Julho",
  "08": "Agosto",
  "09": "Setembro",
  10: "Outubro",
  11: "Novembro",
  12: "Dezembro",
};

export default function App() {
  const [aba, setAba] = useState("cadastro");
  const [mesSelecionado, setMesSelecionado] = useState(
    new Date().toISOString().slice(0, 7)
  );
  // --- NOVO ESTADO: Controle da Janela de Ajuda ---
  const [mostrarAjuda, setMostrarAjuda] = useState(false);

  // --- DADOS ---
  const [turmas, setTurmas] = useState(
    () => JSON.parse(localStorage.getItem("db_turmas")) || []
  );
  const [professores, setProfessores] = useState(
    () => JSON.parse(localStorage.getItem("db_professores")) || []
  );
  const [aulas, setAulas] = useState(
    () => JSON.parse(localStorage.getItem("db_aulas")) || []
  );
  const [resultado, setResultado] = useState([]);

  // --- CONTROLES ---
  const [turmaAtiva, setTurmaAtiva] = useState(null);
  const [horaInicio, setHoraInicio] = useState("18:30");
  const [qtdAulas, setQtdAulas] = useState(2);
  const [qtdProfs, setQtdProfs] = useState(2);
  const [vinculoPendente, setVinculoPendente] = useState(null);

  const calendarRefCadastro = useRef(null);

  useEffect(() => {
    localStorage.setItem("db_turmas", JSON.stringify(turmas));
    localStorage.setItem("db_professores", JSON.stringify(professores));
    localStorage.setItem("db_aulas", JSON.stringify(aulas));
    atualizarVisualizacaoCalendario(aulas);
  }, [turmas, professores, aulas]);

  useEffect(() => {
    if (calendarRefCadastro.current) {
      calendarRefCadastro.current.getApi().gotoDate(mesSelecionado + "-01");
    }
  }, [mesSelecionado]);

  const atualizarVisualizacaoCalendario = (listaAulas) => {
    const eventos = listaAulas.map((aula) => {
      const profs = aula.profIds
        ? professores.filter((p) => aula.profIds.includes(p.id))
        : [];
      const nomes = profs.map((p) => p.nome).join(", ") || "⚠️ NINGUÉM";
      const vagas = aula.qtdProfs || 1;

      let corFundo = aula.turmaCor;
      if (
        aula.profIds &&
        aula.profIds.length > 0 &&
        aula.profIds.length < vagas
      )
        corFundo = "#f59e0b";

      return {
        id: aula.id,
        title: aula.turmaNome,
        date: aula.date,
        backgroundColor: corFundo,
        extendedProps: {
          ...aula,
          profNomes: nomes,
        },
      };
    });
    setResultado(eventos);
  };

  // --- FUNÇÕES ---

  const adicionarTurma = (nomeRecebido) => {
    if (!nomeRecebido) return;
    const nova = {
      id: Date.now(),
      nome: nomeRecebido,
      cor: CORES_TURMAS[turmas.length % CORES_TURMAS.length],
    };
    setTurmas([...turmas, nova]);
    setTurmaAtiva(nova.id);
  };

  const gerenciarCliqueData = (info) => {
    if (vinculoPendente) return;
    if (!turmaAtiva) return alert("⚠️ Selecione uma TURMA antes.");

    const turmaObj = turmas.find((t) => t.id === turmaAtiva);
    const idUnico = `${turmaAtiva}-${info.dateStr}-${horaInicio}`;

    if (aulas.find((a) => a.id === idUnico)) {
      setAulas((prev) => prev.filter((a) => a.id !== idUnico));
    } else {
      setAulas((prev) => [
        ...prev,
        {
          id: idUnico,
          turmaId: turmaObj.id,
          turmaNome: turmaObj.nome,
          turmaCor: turmaObj.cor,
          date: info.dateStr,
          horaInicio,
          qtdAulas,
          qtdProfs,
          vinculoId: null,
          profIds: [],
        },
      ]);
    }
  };

  const gerenciarVincular = (e, aulaId) => {
    e.stopPropagation();
    if (vinculoPendente === aulaId) {
      setVinculoPendente(null);
      return;
    }
    if (!vinculoPendente) {
      setVinculoPendente(aulaId);
    } else {
      const aulaOrigem = aulas.find((a) => a.id === vinculoPendente);
      const aulaDestino = aulas.find((a) => a.id === aulaId);

      if (aulaOrigem.date !== aulaDestino.date) {
        alert("🚫 Regra de Negócio: Vínculos só no MESMO DIA.");
        setVinculoPendente(null);
        return;
      }
      const novoVinculoId = `VINC-${Date.now()}`;
      setAulas((prev) =>
        prev.map((a) => {
          if (a.id === vinculoPendente || a.id === aulaId) {
            return { ...a, vinculoId: novoVinculoId };
          }
          return a;
        })
      );
      setVinculoPendente(null);
    }
  };

  const desvincularAula = (aulaId) => {
    if (window.confirm("Quebrar vínculo?")) {
      setAulas((prev) =>
        prev.map((a) => {
          if (a.id === aulaId) return { ...a, vinculoId: null };
          return a;
        })
      );
    }
  };

  const moverAula = (info) => {
    const { event } = info;
    const novaData = event.startStr.split("T")[0];
    if (window.confirm(`Mover para ${novaData}?`)) {
      setAulas((prev) =>
        prev.map((aula) => {
          if (aula.id === event.id) return { ...aula, date: novaData };
          return aula;
        })
      );
    } else {
      info.revert();
    }
  };

  const limparDistribuicaoMesAtual = () => {
    if (
      !window.confirm(
        `Deseja apagar a distribuição de professores APENAS de ${mesSelecionado}? O histórico dos outros meses será mantido.`
      )
    )
      return;

    setAulas((prev) =>
      prev.map((aula) => {
        if (aula.date.startsWith(mesSelecionado)) {
          return { ...aula, profIds: [] };
        }
        return aula;
      })
    );
    alert("Mês limpo! Agora clique em 'Calcular Distribuição' para refazer.");
  };

  const calcularDistribuicao = () => {
    const horasProfessor = {};
    professores.forEach((p) => (horasProfessor[p.id] = 0));
    const ocupacao = new Set();
    const gruposVinculados = {};
    const aulasSoltas = [];

    let novasAulas = JSON.parse(JSON.stringify(aulas));
    novasAulas.sort((a, b) => new Date(a.date) - new Date(b.date));

    novasAulas.forEach((aula) => {
      if (aula.profIds && aula.profIds.length > 0) {
        aula.profIds.forEach((pId) => {
          horasProfessor[pId] = (horasProfessor[pId] || 0) + aula.qtdAulas;
          ocupacao.add(`${pId}-${aula.date}-${aula.horaInicio}`);
        });
      } else {
        if (aula.vinculoId) {
          if (!gruposVinculados[aula.vinculoId])
            gruposVinculados[aula.vinculoId] = [];
          gruposVinculados[aula.vinculoId].push(aula);
        } else {
          aulasSoltas.push(aula);
        }
      }
    });

    const escolherProfessores = (listaDeAulas) => {
      const aulaModelo = listaDeAulas[0];
      const vagas = aulaModelo.qtdProfs || 1;

      let candidatos = professores.filter((p) => {
        return listaDeAulas.every((aula) => {
          const chaveOcupacao = `${p.id}-${aula.date}-${aula.horaInicio}`;
          return (
            p.disponibilidade.includes(aula.date) &&
            !ocupacao.has(chaveOcupacao)
          );
        });
      });

      candidatos = candidatos.sort(() => Math.random() - 0.5);
      candidatos.sort((a, b) => horasProfessor[a.id] - horasProfessor[b.id]);

      const selecionados = candidatos.slice(0, vagas);

      selecionados.forEach((p) => {
        horasProfessor[p.id] += aulaModelo.qtdAulas * listaDeAulas.length;
        listaDeAulas.forEach((aula) => {
          ocupacao.add(`${p.id}-${aula.date}-${aula.horaInicio}`);
        });
      });

      return selecionados.map((p) => p.id);
    };

    Object.values(gruposVinculados).forEach((grupoAulas) => {
      const idsEscolhidos = escolherProfessores(grupoAulas);
      grupoAulas.forEach((aula) => {
        aula.profIds = idsEscolhidos;
      });
    });

    aulasSoltas.forEach((aula) => {
      const idsEscolhidos = escolherProfessores([aula]);
      aula.profIds = idsEscolhidos;
    });

    setAulas(novasAulas);
    setAba("relatorio");
  };

  const resumoProfessores = professores
    .map((p) => {
      const aulasDoProf = aulas.filter(
        (a) => a.profIds && a.profIds.includes(p.id)
      );

      const totalGeral = aulasDoProf.reduce(
        (acc, curr) => acc + curr.qtdAulas,
        0
      );

      const dadosPorMes = {};

      aulasDoProf.forEach((aula) => {
        const mesAno = aula.date.slice(0, 7);
        const turmaNome = aula.turmaNome;
        const qtd = aula.qtdAulas;

        if (!dadosPorMes[mesAno]) {
          dadosPorMes[mesAno] = { total: 0, turmas: {} };
        }

        dadosPorMes[mesAno].total += qtd;
        dadosPorMes[mesAno].turmas[turmaNome] =
          (dadosPorMes[mesAno].turmas[turmaNome] || 0) + qtd;
      });

      const arrayMeses = Object.entries(dadosPorMes)
        .sort()
        .map(([mesIso, dados]) => {
          const [ano, mes] = mesIso.split("-");
          const nomeMes = MESES_EXTENSO[mes] || mes;

          const detalheTurmas = Object.entries(dados.turmas)
            .map(([t, q]) => `${t}: ${q}`)
            .join(", ");

          return {
            mesOriginal: mesIso,
            mesFormatado: `${nomeMes}/${ano}`,
            total: dados.total,
            detalheTurmas: detalheTurmas,
          };
        });

      const totalMesAtual = dadosPorMes[mesSelecionado]?.total || 0;

      const vinculosUnicos = new Set();
      aulasDoProf.forEach((a) => {
        if (a.vinculoId) vinculosUnicos.add(a.vinculoId);
      });
      const qtdDuplas = vinculosUnicos.size;

      return {
        nome: p.nome,
        totalGeral,
        totalMesAtual,
        dadosMensais: arrayMeses,
        qtdDuplas,
      };
    })
    .filter((item) => item.totalGeral > 0)
    .sort((a, b) => b.totalMesAtual - a.totalMesAtual);

  return (
    <div style={ESTILOS.container}>
      <header style={ESTILOS.header}>
        <h1>🗓️ Gestão de Aulas - CFP 2026</h1>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <p style={{ color: "#64748b", margin: 0 }}>
            Sistema Isonômico de Distribuição de Aulas
          </p>
          <button
            onClick={() => setMostrarAjuda(true)}
            style={ESTILOS.btnAjuda}
          >
            ❓ Ajuda
          </button>
        </div>
      </header>

      <div style={ESTILOS.menu}>
        <button
          style={ESTILOS.btnMenu(aba === "cadastro")}
          onClick={() => setAba("cadastro")}
        >
          1. Cadastrar Aulas
        </button>
        <button
          style={ESTILOS.btnMenu(aba === "professores")}
          onClick={() => setAba("professores")}
        >
          2. Disponibilidade Professores
        </button>
        <button
          style={ESTILOS.btnMenu(aba === "relatorio")}
          onClick={calcularDistribuicao}
        >
          3. Gerar Relatório
        </button>
      </div>

      <div style={ESTILOS.card}>
        {aba === "cadastro" && (
          <CadastroAulas
            turmas={turmas}
            aulas={aulas}
            setAulas={setAulas}
            turmaAtiva={turmaAtiva}
            setTurmaAtiva={setTurmaAtiva}
            mesSelecionado={mesSelecionado}
            setMesSelecionado={setMesSelecionado}
            horaInicio={horaInicio}
            setHoraInicio={setHoraInicio}
            qtdAulas={qtdAulas}
            setQtdAulas={setQtdAulas}
            qtdProfs={qtdProfs}
            setQtdProfs={setQtdProfs}
            vinculoPendente={vinculoPendente}
            adicionarTurma={adicionarTurma}
            gerenciarCliqueData={gerenciarCliqueData}
            gerenciarVincular={gerenciarVincular}
            desvincularAula={desvincularAula}
            moverAula={moverAula}
            calendarRef={calendarRefCadastro}
          />
        )}

        {aba === "professores" && (
          <GestaoProfessores
            professores={professores}
            setProfessores={setProfessores}
          />
        )}

        {aba === "relatorio" && (
          <Relatorio
            mesSelecionado={mesSelecionado}
            setMesSelecionado={setMesSelecionado}
            limparDistribuicaoMesAtual={limparDistribuicaoMesAtual}
            resultado={resultado}
            resumoProfessores={resumoProfessores}
          />
        )}
      </div>

      {/* --- MODAL DE AJUDA --- */}
      {mostrarAjuda && (
        <div
          style={ESTILOS.modalOverlay}
          onClick={() => setMostrarAjuda(false)}
        >
          <div
            style={ESTILOS.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={ESTILOS.modalClose}
              onClick={() => setMostrarAjuda(false)}
            >
              ✕
            </button>

            <h2 style={ESTILOS.tituloAjuda}>Sobre o Sistema</h2>
            <p style={{ lineHeight: "1.6", color: "#334155" }}>
              Este aplicativo tem como objetivo automatizar e gerenciar a
              distribuição de aulas da <strong>ACADEPOL</strong>, garantindo, na
              medida do possível, isonomia na carga horária entre os professores
              disponíveis.
            </p>

            <h3
              style={{ color: "#2563eb", fontSize: "16px", marginTop: "20px" }}
            >
              Funcionalidades Principais:
            </h3>

            <ul
              style={{
                paddingLeft: "20px",
                lineHeight: "1.6",
                color: "#475569",
              }}
            >
              <li style={{ marginBottom: "10px" }}>
                <strong>1. Cadastro Visual:</strong> Clique no calendário para
                adicionar aulas. Use o recurso de <em>Arrastar e Soltar</em>{" "}
                para mudar datas rapidamente.
              </li>
              <li style={{ marginBottom: "10px" }}>
                <strong>2. Vínculo de Aulas (🔗):</strong> Permite ligar duas
                aulas no
                <strong> mesmo dia</strong>. O sistema garantirá que os mesmos
                professores sejam escalados para ambos os horários, otimizando o
                deslocamento.
              </li>
              <li style={{ marginBottom: "10px" }}>
                <strong>3. Isonomia Automática:</strong> O algoritmo de
                distribuição prioriza professores que têm menos horas
                acumuladas, respeitada a regra de disponibilidade, garantindo
                uma divisão justa das aulas.
              </li>
              <li style={{ marginBottom: "10px" }}>
                <strong>4. Histórico Mensal:</strong> O sistema memoriza as
                aulas passadas. Ao gerar uma nova distribuição para o mês
                seguinte, ele considera o acumulado dos meses anteriores.
              </li>
            </ul>

            <h3
              style={{ color: "#2563eb", fontSize: "16px", marginTop: "20px" }}
            >
              Dicas de Uso:
            </h3>
            <ul
              style={{
                paddingLeft: "20px",
                lineHeight: "1.6",
                color: "#475569",
              }}
            >
              <li>
                Cadastre primeiro <strong>todas</strong> as turmas e suas
                respectivas aulas.
              </li>
              <li>
                Em seguida, cadastre a disponibilidade dos professores na aba 2.
              </li>
              <li>
                Por fim, gere a distribuição. Se precisar corrigir algo em um
                mês específico, use o botão <em>"Redistribuir Mês Atual"</em>.
              </li>
            </ul>

            <div
              style={{
                marginTop: "25px",
                textAlign: "center",
                fontSize: "12px",
                color: "#94a3b8",
              }}
            >
              Versão 1.0 - Desenvolvido por Gustavo Lazzarotto Demarco
            </div>
          </div>
        </div>
      )}

      <footer style={ESTILOS.footer}>
        Desenvolvido por Gustavo Lazzarotto Demarco
      </footer>
    </div>
  );
}
