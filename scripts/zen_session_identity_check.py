#!/usr/bin/env python3
"""zen_session_identity_check.py — hook stdin の session 判別 (共通 helper)

rebuild-20260711 契約 §10 / Z-V4。Kai cross-review RETURN (7/11) の P1 対応:
旧実装は「subagent の証拠があれば skip」で、空/壊れた stdin が main 扱いに
fall through して mutate した (fail-closed の向きが逆)。本実装は反転:
**main session の証拠が構造的に揃った時だけ "main"**、それ以外は全て skip。

stdout に 1 行だけ出す:
  main                            -> mutate してよい
  skip:<reason>                   -> mutate しない (reason は guard log 用)

判定 (全て top-level の decoded field、raw 文字列 match はしない = P2-2 対応):
  - stdin が JSON object として parse できない -> skip:stdin_not_json
  - top-level に agent_id がある (subagent 限定 field) -> skip:agent_id_present
  - session_id / transcript_path が非空 string で揃っていない
      -> skip:missing_session_fields (空 stdin もここに落ちる)
  - decoded transcript_path に subagents segment (separator 混在対応)
      -> skip:subagents_transcript_path
  - 上記を全て通過 -> main
"""
import sys
import json


def main() -> None:
    try:
        data = json.loads(sys.stdin.read())
    except Exception:
        print("skip:stdin_not_json")
        return
    if not isinstance(data, dict):
        print("skip:stdin_not_object")
        return
    if "agent_id" in data:
        print("skip:agent_id_present")
        return
    session_id = data.get("session_id")
    transcript_path = data.get("transcript_path")
    if (
        not isinstance(session_id, str)
        or not session_id.strip()
        or not isinstance(transcript_path, str)
        or not transcript_path.strip()
    ):
        print("skip:missing_session_fields")
        return
    normalized = transcript_path.replace("\\", "/")
    parts = [p for p in normalized.split("/") if p]
    if "subagents" in parts:
        print("skip:subagents_transcript_path")
        return
    print("main")


if __name__ == "__main__":
    main()
