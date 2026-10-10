@echo off
setlocal
title ARMA DATAPEL - CONFIGURACION WINDOWS
echo.
echo ============================================================
echo          ARMA DATAPEL - CONFIGURACION DE ESTE PC
echo ============================================================
echo.
echo Este proceso se ejecuta UNA SOLA VEZ por usuario Windows.
echo No requiere permisos de Administrador.
echo No instala programas. Usa mstsc.exe incluido en Windows.
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $root=Join-Path $env:LOCALAPPDATA 'ARMA\DATAPEL'; New-Item -ItemType Directory -Path $root -Force | Out-Null; $handler=Join-Path $root 'ARMA_DATAPEL_HANDLER.ps1'; [IO.File]::WriteAllBytes($handler,[Convert]::FromBase64String('77u/cGFyYW0oW3N0cmluZ10kVXJpKQokRXJyb3JBY3Rpb25QcmVmZXJlbmNlID0gJ1N0b3AnCiRSb290ID0gSm9pbi1QYXRoICRlbnY6TE9DQUxBUFBEQVRBICdBUk1BXERBVEFQRUwnCiRSZHBGaWxlID0gSm9pbi1QYXRoICRSb290ICdBUk1BX0RBVEFQRUwucmRwJwokSG9zdE5hbWUgPSAnMjAwLjExOS4xMTIuMTE1JwokUG9ydCA9ICc1ODkwJwoKZnVuY3Rpb24gR2V0LVF1ZXJ5VmFsdWUoW3N0cmluZ10kUmF3VXJpLFtzdHJpbmddJEtleSkgewogICAgaWYgKFtzdHJpbmddOjpJc051bGxPcldoaXRlU3BhY2UoJFJhd1VyaSkpIHsgcmV0dXJuICcnIH0KICAgICRxcG9zID0gJFJhd1VyaS5JbmRleE9mKCc/JykKICAgIGlmICgkcXBvcyAtbHQgMCkgeyByZXR1cm4gJycgfQogICAgJHF1ZXJ5ID0gJFJhd1VyaS5TdWJzdHJpbmcoJHFwb3MgKyAxKQogICAgZm9yZWFjaCAoJHBhaXIgaW4gKCRxdWVyeSAtc3BsaXQgJyYnKSkgewogICAgICAgICRwYXJ0cyA9ICRwYWlyIC1zcGxpdCAnPScsMgogICAgICAgIGlmICgkcGFydHMuQ291bnQgLWVxIDIgLWFuZCAkcGFydHNbMF0gLWVxICRLZXkpIHsKICAgICAgICAgICAgcmV0dXJuIFtVcmldOjpVbmVzY2FwZURhdGFTdHJpbmcoJHBhcnRzWzFdLlJlcGxhY2UoJysnLCcgJykpCiAgICAgICAgfQogICAgfQogICAgcmV0dXJuICcnCn0KCiR1c2VyID0gKEdldC1RdWVyeVZhbHVlICRVcmkgJ3UnKS5UcmltKCkKaWYgKFtzdHJpbmddOjpJc051bGxPcldoaXRlU3BhY2UoJHVzZXIpKSB7CiAgICBBZGQtVHlwZSAtQXNzZW1ibHlOYW1lIFByZXNlbnRhdGlvbkZyYW1ld29yawogICAgW1N5c3RlbS5XaW5kb3dzLk1lc3NhZ2VCb3hdOjpTaG93KAogICAgICAgICdBUk1BIG5vIHJlY2liaW8gZWwgdXN1YXJpbyBSRFAuIFJlZ3Jlc2UgYSBEQVRBUEVMIGUgaW50ZW50ZSBudWV2YW1lbnRlLicsCiAgICAgICAgJ0FSTUEgREFUQVBFTCcKICAgICkgfCBPdXQtTnVsbAogICAgZXhpdCAyCn0KCmlmICgkdXNlci5MZW5ndGggLWd0IDEyOCAtb3IgJHVzZXIgLW1hdGNoICdbXHgwMC1ceDFGJiM/XScpIHsgZXhpdCAzIH0KCiRsaW5lcyA9IEAoCiAgICAnc2NyZWVuIG1vZGUgaWQ6aToyJywKICAgICd1c2UgbXVsdGltb246aTowJywKICAgICdzZXNzaW9uIGJwcDppOjMyJywKICAgICdjb21wcmVzc2lvbjppOjEnLAogICAgJ2tleWJvYXJkaG9vazppOjInLAogICAgJ2F1ZGlvbW9kZTppOjInLAogICAgJ25ldHdvcmthdXRvZGV0ZWN0Omk6MScsCiAgICAnYmFuZHdpZHRoYXV0b2RldGVjdDppOjEnLAogICAgJ2Rpc3BsYXljb25uZWN0aW9uYmFyOmk6MScsCiAgICAnZGlzYWJsZSB3YWxscGFwZXI6aToxJywKICAgICdhbGxvdyBmb250IHNtb290aGluZzppOjEnLAogICAgJ2FsbG93IGRlc2t0b3AgY29tcG9zaXRpb246aToxJywKICAgICgnZnVsbCBhZGRyZXNzOnM6JyArICRIb3N0TmFtZSArICc6JyArICRQb3J0KSwKICAgICgndXNlcm5hbWU6czonICsgJHVzZXIpLAogICAgJ3Byb21wdCBmb3IgY3JlZGVudGlhbHM6aTowJywKICAgICdhdXRoZW50aWNhdGlvbiBsZXZlbDppOjInLAogICAgJ2VuYWJsZWNyZWRzc3BzdXBwb3J0Omk6MScsCiAgICAncmVtb3RlYXBwbGljYXRpb25tb2RlOmk6MCcsCiAgICAncmVkaXJlY3RjbGlwYm9hcmQ6aToxJywKICAgICdyZWRpcmVjdHByaW50ZXJzOmk6MCcsCiAgICAncmVkaXJlY3Rjb21wb3J0czppOjAnLAogICAgJ3JlZGlyZWN0c21hcnRjYXJkczppOjAnLAogICAgJ3JlZGlyZWN0d2ViYXV0aG46aTowJywKICAgICdkcml2ZXN0b3JlZGlyZWN0OnM6JwopCgpbSU8uRmlsZV06OldyaXRlQWxsVGV4dCgKICAgICRSZHBGaWxlLAogICAgKCgkbGluZXMgLWpvaW4gImByYG4iKSArICJgcmBuIiksCiAgICBbVGV4dC5FbmNvZGluZ106OlVuaWNvZGUKKQoKU3RhcnQtUHJvY2VzcyAtRmlsZVBhdGggKEpvaW4tUGF0aCAkZW52OldJTkRJUiAnU3lzdGVtMzJcbXN0c2MuZXhlJykgLUFyZ3VtZW50TGlzdCAoJyInICsgJFJkcEZpbGUgKyAnIicpCg==')); $p='HKCU:\Software\Classes\arma-datapel'; New-Item -Path $p -Force | Out-Null; Set-Item -Path $p -Value 'URL:ARMA DATAPEL'; New-ItemProperty -Path $p -Name 'URL Protocol' -PropertyType String -Value '' -Force | Out-Null; New-Item -Path ($p+'\DefaultIcon') -Force | Out-Null; Set-Item -Path ($p+'\DefaultIcon') -Value ((Join-Path $env:WINDIR 'System32\mstsc.exe')+',0'); New-Item -Path ($p+'\shell\open\command') -Force | Out-Null; $ps=(Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'); $cmd='""'+$ps+'"" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""'+$handler+'"" ""%%1""'; Set-Item -Path ($p+'\shell\open\command') -Value $cmd"

if errorlevel 1 goto :error

echo.
echo ARMA DATAPEL QUEDO CONFIGURADO CORRECTAMENTE.
echo.
echo Regrese a ARMA ^> DATAPEL y pulse ABRIR DATAPEL.
echo La primera vez el navegador puede preguntar si permite abrir ARMA DATAPEL.
echo Seleccione Permitir / Abrir y, si aparece, recuerde esa decision.
echo.
pause
exit /b 0

:error
echo.
echo NO FUE POSIBLE CONFIGURAR ARMA DATAPEL EN ESTE USUARIO WINDOWS.
echo Use temporalmente la opcion de respaldo .RDP desde ARMA.
echo.
pause
exit /b 1
