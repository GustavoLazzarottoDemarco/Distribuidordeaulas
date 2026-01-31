import React, { useState } from "react"; // IMPORTANTE: useState adicionado
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { ESTILOS } from "./styles";

export default function CadastroAulas({
  turmas,
  aulas,
  setAulas,
  turmaAtiva,
  setTurmaAtiva,
  mesSelecionado,
  setMesSelecionado,
  horaInicio,
  setHoraInicio,
  qtdAulas,
  setQtdAulas,
  qtdProfs,
  setQtdProfs,
  vinculoPendente,
  adicionarTurma,
  gerenciarCliqueData,
  gerenciarVincular,
  desvincularAula,
  moverAula,
  calendarRef,
}) {
  const [novaTurma, setNovaTurma] = useState(""); // Estado local para o input

  return (
    <>
      <div style={ESTILOS.aviso}>
        <strong>Como vincular aulas no mesmo dia?</strong> Clique no ícone de
        corrente 🔗. A aula ficará amarela. Clique na segunda aula do mesmo dia.
        O sistema garantirá que sejam os mesmos professores para ambas.
      </div>

      <div
        style={{
          ...ESTILOS.controlBar,
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "15px",
        }}
      >
        {/* LINHA 1: Inputs de Controle */}
        <div
          style={{
            display: "flex",
            gap: "15px",
            flexWrap: "wrap",
            alignItems: "center",
            width: "100%",
          }}
        >
          {/* MUDANÇA AQUI: Input de Nova Turma igual ao de Professores */}
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Turma - Cargo"
              value={novaTurma}
              onChange={(e) => setNovaTurma(e.target.value)}
              style={ESTILOS.input}
              onKeyDown={(e) => {
                if (e.key === "Enter" && novaTurma.trim()) {
                  adicionarTurma(novaTurma);
                  setNovaTurma("");
                }
              }}
            />
            <button
              onClick={() => {
                if (!novaTurma.trim()) return;
                adicionarTurma(novaTurma);
                setNovaTurma("");
              }}
              style={ESTILOS.btnAcao}
            >
              +
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: "14px" }}>Mês:</span>
            <input
              type="month"
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(e.target.value)}
              style={ESTILOS.input}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: "14px" }}>Horário:</span>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              style={ESTILOS.input}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: "14px" }}>Carga:</span>
            <input
              type="number"
              value={qtdAulas}
              onChange={(e) => setQtdAulas(Number(e.target.value))}
              style={{ ...ESTILOS.input, width: "50px" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: "14px" }}>Profs:</span>
            <input
              type="number"
              min="1"
              value={qtdProfs}
              onChange={(e) => setQtdProfs(Number(e.target.value))}
              style={{ ...ESTILOS.input, width: "50px" }}
            />
          </div>
        </div>

        {/* LINHA 2: Botões das Turmas */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            width: "100%",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "10px",
          }}
        >
          <span
            style={{ fontSize: "14px", color: "#64748b", alignSelf: "center" }}
          >
            Turmas:
          </span>
          {turmas.length === 0 && (
            <span
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                alignSelf: "center",
              }}
            >
              Nenhuma turma criada.
            </span>
          )}
          {turmas.map((t) => (
            <button
              key={t.id}
              onClick={() => setTurmaAtiva(t.id)}
              style={ESTILOS.turmaTag(t.cor, turmaAtiva === t.id)}
            >
              {t.nome}
            </button>
          ))}
        </div>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={ptBrLocale}
        editable={true} // Habilita Drag & Drop
        eventDrop={moverAula} // Função chamada ao soltar a aula
        dateClick={gerenciarCliqueData}
        eventClick={(info) => {
          const temVinculo = info.event.extendedProps.vinculoId;

          // Se tem vínculo e não estou no meio de uma ação de vincular, pergunto se quer desfazer
          if (temVinculo && !vinculoPendente) {
            desvincularAula(info.event.id);
          }
          // Se não tem vínculo, posso remover ou começar a vincular
          else if (!vinculoPendente && !temVinculo) {
            if (window.confirm("Remover esta aula da grade?"))
              setAulas((prev) => prev.filter((a) => a.id !== info.event.id));
          } else {
            const e = { stopPropagation: () => {} };
            gerenciarVincular(e, info.event.id);
          }
        }}
        events={aulas.map((a) => ({
          id: a.id,
          date: a.date,
          backgroundColor: a.turmaCor,
          extendedProps: { ...a },
        }))}
        eventContent={(arg) => (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "2px 4px",
              border:
                vinculoPendente === arg.event.id
                  ? "2px solid #fbbf24"
                  : arg.event.extendedProps.vinculoId
                  ? "2px solid #fff"
                  : "1px solid transparent",
              borderRadius: "3px",
              cursor: "grab",
              flexDirection: "row",
              gap: "4px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {arg.event.extendedProps.vinculoId ? "🔗 " : ""}
                {arg.event.extendedProps.turmaNome}
              </div>
              <div style={{ fontSize: "9px", opacity: 0.9 }}>
                🕒 {arg.event.extendedProps.horaInicio} | 👨‍🏫{" "}
                {arg.event.extendedProps.qtdProfs}
              </div>
            </div>

            <button
              onClick={(e) => gerenciarVincular(e, arg.event.id)}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: "0 4px",
                fontSize: "14px",
              }}
              title="Vincular aula"
            >
              🔗
            </button>
          </div>
        )}
      />
    </>
  );
}
