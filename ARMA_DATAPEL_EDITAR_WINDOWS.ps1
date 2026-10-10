param([string]$Uri)
$ErrorActionPreference='Stop'

$Root = Join-Path $env:LOCALAPPDATA 'ARMA\RDP'
$AdminRdp = Join-Path $Root 'DATAPEL_ADMIN.rdp'
$UserRdp  = Join-Path $Root 'DATAPEL_USUARIO.rdp'

Add-Type -AssemblyName PresentationFramework

function Fail([string]$Message) {
    [System.Windows.MessageBox]::Show($Message,'ARMA DATAPEL','OK','Error') | Out-Null
    exit 2
}
function Ok([string]$Message) {
    [System.Windows.MessageBox]::Show($Message,'ARMA DATAPEL','OK','Information') | Out-Null
}
function QueryValue([string]$Raw,[string]$Name) {
    if([string]::IsNullOrWhiteSpace($Raw)){ return '' }
    $q = $Raw.IndexOf('?')
    if($q -lt 0){ return '' }
    foreach($pair in ($Raw.Substring($q+1) -split '&')){
        $p = $pair -split '=',2
        if($p.Count -eq 2 -and $p[0] -eq $Name){
            return [Uri]::UnescapeDataString($p[1])
        }
    }
    return ''
}
function ReadLines([string]$Path) {
    return [IO.File]::ReadAllLines($Path,[Text.Encoding]::Unicode)
}
function SetLine([string[]]$Lines,[string]$Prefix,[string]$Value) {
    $done=$false
    for($i=0;$i -lt $Lines.Count;$i++){
        if($Lines[$i].StartsWith($Prefix,[StringComparison]::OrdinalIgnoreCase)){
            $Lines[$i]=$Value
            $done=$true
        }
    }
    if(!$done){ $Lines += $Value }
    return ,$Lines
}

if(!(Test-Path $AdminRdp) -or !(Test-Path $UserRdp)){
    Fail 'ARMA DATAPEL no esta configurado en este usuario Windows. Ejecute primero CONFIGURAR ESTE PC desde ARMA.'
}

$Address = (QueryValue $Uri 'address').Trim()
$User    = (QueryValue $Uri 'user').Trim()
$Password= QueryValue $Uri 'password'

if([string]::IsNullOrWhiteSpace($Address)){ Fail 'La direccion RDP esta vacia.' }
if($Address -notmatch '^[A-Za-z0-9\.\-]+:\d{1,5}$'){ Fail 'Use el formato HOST:PUERTO. Ejemplo: 200.119.112.115:5890' }

$PortText = ($Address -split ':')[-1]
$Port = 0
if(![int]::TryParse($PortText,[ref]$Port) -or $Port -lt 1 -or $Port -gt 65535){ Fail 'Puerto RDP invalido.' }

$Admin = ReadLines $AdminRdp
$Normal = ReadLines $UserRdp

$Admin = SetLine $Admin 'full address:s:' ('full address:s:'+$Address)
$Normal = SetLine $Normal 'full address:s:' ('full address:s:'+$Address)

if(-not [string]::IsNullOrWhiteSpace($User)){
    $Admin = SetLine $Admin 'username:s:' ('username:s:'+$User)
    $Admin = SetLine $Admin 'prompt for credentials:i:' 'prompt for credentials:i:0'
}

[IO.File]::WriteAllLines($AdminRdp,$Admin,[Text.Encoding]::Unicode)
[IO.File]::WriteAllLines($UserRdp,$Normal,[Text.Encoding]::Unicode)

if(-not [string]::IsNullOrEmpty($Password)){
    if([string]::IsNullOrWhiteSpace($User)){ Fail 'Para guardar una nueva contrasena tambien debe indicar el usuario RDP.' }
    $HostOnly = $Address
    if($Address -match '^(.*):(\d+)$'){ $HostOnly=$matches[1] }

    & cmdkey.exe /generic:("TERMSRV/"+$HostOnly) /user:$User /pass:$Password | Out-Null
    & cmdkey.exe /generic:("TERMSRV/"+$Address) /user:$User /pass:$Password | Out-Null
}

Ok ('Conexion DATAPEL actualizada.'+"`n`n"+'Direccion: '+$Address+"`n"+$(if($User){'Usuario: '+$User}else{'Usuario: sin cambio'})+"`n"+$(if($Password){'Credencial: actualizada'}else{'Credencial: sin cambio'}))
