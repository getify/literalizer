/* test #8
 * testing how literalizer works
 */

return /a/g;
throw /a/g;
delete /a/g;
in /a/g;
a.in /a/g;
a. in /a/g;
a . in /a/g;
42.in /b/g;
42. in /b/g;
else /a/g;
void /a/g;
typeof /a/g;
yield /a/g;
return/*a
*/{}/a/g;
return/*a*/{}/a/g;
(/a/g)
[/a/g]
{/a/g}
+/a/g;
-/a/g;
*/a/g;
=/a/g;
~/a/g;
!/a/g;
%/a/g;
&/a/g;
,/a/g;
|/a/g;
;/a/g;
:/a/g;
?/a/g;
</a/g;
>/a/g;
0/ /a/g;
/a/ / /a/;
/a/;
/a/g;
/a/,
/a/);
/a/%
/a/ ;
/a/;
if(a)/a/g;
while  (a||(b)&&(c||d)) /a/g;
for (;;)
/a/g;
(a)/a/g;
(a) (a) /a/g;
{a:/a/g};
{a:
/a/g};
{}/a/g;
{a:{}/a/g};
{a:{}
/a/g}
a={a:/a/g};
{a:{a:/a/g}};
a={a:{a:/a/g}};
{a();a:/a/g;a:a();a:/a/g;};
{a:function(){}/a/g};
{a:
function(){}/a/g}
{a:{a:function(){}/a/g}};
{a:
	{a:
		function(){}/a/g}};
a={a:function(){}/a/g};
a={a:{a:function(){}/a/g}};
a
=
{a:{a:function(){}/a/g}};
a{a:{a:function(){}/a/g}};
{a:{a={a:function(){a={a:a/a/g}/a/g}(/a/g)/a/g}/a/g}/a/g}/a/g;
a
// a comment
{a:{a:function(){}/a/g}};
a
/* a comment */
	{a:{a:function(){}/a/g}};
function* foo(){/a/g}/a/g;
function*(){/a/g}/a/g;
a=function* foo(){/a/g}/a/g;
a=function*(){/a/g}/a/g;
a=>/a/g;
a=>a/a/g;
"a"
{}/a/g;
a/a/g;
case "a":{}/a/g;
default:{}/a/g;
a:{}/a/g;
a b:{}/a/g;
a
/a/g;
a
{}/a/g;
/ / / / /;
/\/g\//g;
/\//g;
/\/\//g;
/[/]/g;
/a/